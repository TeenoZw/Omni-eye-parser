<script>
	import {
		MapLibre,
		Marker,
		Popup,
		GeoJSONSource,
		LineLayer,
		CircleLayer
	} from 'svelte-maplibre-gl';
	import data from './data.json';

	const DEFAULT_MAP_CENTER = [29.84893, -18.8983116];
	const STOP_SPEED_KMH = 1;
	const STOP_MIN_DURATION_S = 30;
	const MAX_KMH = 180;
	const GAUGE_R = 52;
	const GAUGE_C = 2 * Math.PI * GAUGE_R;

	let currentTrip = $state(
		data.trips.find((trip) => trip.distance_km > 0 && (trip.points?.length ?? 0) > 1) ??
			data.trips[0]
	);
	let isPlaying = $state(false);
	let playbackSpeed = $state(1);
	let seekPosition = $state(0);
	let showFilters = $state(true);
	let dateFilter = $state('');
	let distanceFilter = $state('');
	let speedFilter = $state('');
	let filteredTrips = $state(data.trips);
	let multiSelectMode = $state(false);
	let rangeStart = $state(null);
	let rangeEnd = $state(null);
	let playbackTime = $state(0);
	let snapToRoads = $state(false);
	let snappedCoordinates = $state([]);
	let snapping = $state(false);
	let followPlayback = $state(true);
	let mapCenter = $state(DEFAULT_MAP_CENTER);
	let rafId = 0;

	$effect(() => {
		filteredTrips = data.trips.filter((trip) => {
			if (dateFilter && !new Date(trip.start_time).toDateString().includes(dateFilter)) return false;
			if (distanceFilter && trip.distance_km < parseFloat(distanceFilter)) return false;
			if (speedFilter && trip.max_speed_kmh < parseFloat(speedFilter)) return false;
			return true;
		});
	});

	let visibleTrips = $derived.by(() => filteredTrips.filter((trip) => trip.distance_km > 0));
	let selectedRange = $derived.by(() => {
		if (rangeStart == null) return null;
		const end = rangeEnd ?? rangeStart;
		return {
			s: Math.min(rangeStart, end),
			e: Math.max(rangeStart, end)
		};
	});

	function clearSelection() {
		rangeStart = null;
		rangeEnd = null;
	}

	function toggleRangeTrip(trip) {
		const index = visibleTrips.findIndex((item) => item.end_time === trip.end_time);
		if (index < 0) return;
		if (rangeStart == null) {
			rangeStart = index;
			rangeEnd = index;
			return;
		}
		rangeEnd = index;
	}

	function buildCombinedSelection() {
		if (!selectedRange) return null;
		const selectedTrips = visibleTrips.slice(selectedRange.s, selectedRange.e + 1);
		if (!selectedTrips.length) return null;

		const allPoints = selectedTrips
			.flatMap((trip) =>
				(trip.points ?? []).filter((point) => Number.isFinite(point.lon) && Number.isFinite(point.lat))
			)
			.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

		if (allPoints.length < 2) return null;

		const startPoint = allPoints[0];
		const endPoint = allPoints[allPoints.length - 1];
		const distanceKm = selectedTrips.reduce((sum, trip) => sum + (Number(trip.distance_km) || 0), 0);
		const maxSpeed = selectedTrips.reduce(
			(max, trip) => Math.max(max, Number.isFinite(trip.max_speed_kmh) ? trip.max_speed_kmh : 0),
			0
		);

		let weighted = 0;
		let durationSum = 0;
		for (const trip of selectedTrips) {
			const start = new Date(trip.start_time).getTime();
			const end = new Date(trip.end_time).getTime();
			const duration = Math.max(0, end - start) / 1000;
			const avg = Number.isFinite(trip.avg_moving_speed_kmh) ? trip.avg_moving_speed_kmh : 0;
			weighted += duration * avg;
			durationSum += duration;
		}

		return {
			_combined: true,
			name: `Combined ${selectedTrips.length} trips`,
			start_time: selectedTrips[0].start_time ?? startPoint.ts,
			end_time: selectedTrips[selectedTrips.length - 1].end_time ?? endPoint.ts,
			distance_km: distanceKm,
			max_speed_kmh: maxSpeed,
			avg_moving_speed_kmh: durationSum > 0 ? weighted / durationSum : 0,
			start_lat: startPoint.lat,
			start_lon: startPoint.lon,
			end_lat: endPoint.lat,
			end_lon: endPoint.lon,
			points: allPoints
		};
	}

	function playCombinedSelection() {
		const combined = buildCombinedSelection();
		if (combined) selectTrip(combined);
	}

	function selectTrip(trip) {
		currentTrip = trip;
		playbackTime = trip?.points?.length ? new Date(trip.points[0].ts).getTime() : 0;
		seekPosition = 0;
		followPlayback = true;
		stopPlayback();
	}

	function previewTrip(trip) {
		currentTrip = trip;
		seekPosition = 0;
		followPlayback = true;
		if (isPlaying) stopPlayback();
	}

	function playPause() {
		if (isPlaying) stopPlayback();
		else startPlayback();
	}

	function startPlayback() {
		if (!currentTrip?.points?.length) return;
		if (!(tripEndMs > tripStartMs)) return;
		if (!playbackTime || playbackTime < tripStartMs || playbackTime > tripEndMs) {
			playbackTime = tripStartMs;
		}

		isPlaying = true;
		let last = performance.now();
		const loop = (now) => {
			if (!isPlaying) return;
			const delta = now - last;
			last = now;
			playbackTime = Math.min(playbackTime + delta * playbackSpeed, tripEndMs);
			if (playbackTime >= tripEndMs) {
				stopPlayback();
				return;
			}
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);
	}

	function stopPlayback() {
		isPlaying = false;
		if (rafId) cancelAnimationFrame(rafId);
		rafId = 0;
	}

	function resetPlayback() {
		stopPlayback();
		playbackTime = tripStartMs;
		seekPosition = 0;
	}

	function seekToPosition(position) {
		if (!(tripEndMs > tripStartMs)) return;
		playbackTime = tripStartMs + (position / 100) * (tripEndMs - tripStartMs);
		seekPosition = position;
	}

	function gotoPrevTrip() {
		const index = visibleTrips.findIndex((trip) => trip.end_time === currentTrip?.end_time);
		if (index > 0) selectTrip(visibleTrips[index - 1]);
	}

	function gotoNextTrip() {
		const index = visibleTrips.findIndex((trip) => trip.end_time === currentTrip?.end_time);
		if (index >= 0 && index < visibleTrips.length - 1) selectTrip(visibleTrips[index + 1]);
	}

	function toggleTripPlay(trip) {
		const isCurrent = currentTrip?.end_time === trip.end_time;
		if (isCurrent && isPlaying) {
			stopPlayback();
			return;
		}
		if (!isCurrent) selectTrip(trip);
		startPlayback();
	}

	function recenterMap() {
		if (currentPointCoordinates && currentPointCoordinates.length === 2) {
			mapCenter = currentPointCoordinates;
		} else if (currentTripStartLngLat) {
			mapCenter = currentTripStartLngLat;
		} else {
			mapCenter = DEFAULT_MAP_CENTER;
		}
		followPlayback = true;
	}

	function disableAutoFollow() {
		followPlayback = false;
	}

	function handleKeydown(event) {
		if (!visibleTrips.length) return;
		const currentIndex = visibleTrips.findIndex((trip) => trip.end_time === currentTrip?.end_time);

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
				event.preventDefault();
				if (currentIndex > 0) selectTrip(visibleTrips[currentIndex - 1]);
				break;
			case 'ArrowRight':
			case 'ArrowDown':
				event.preventDefault();
				if (currentIndex < visibleTrips.length - 1) selectTrip(visibleTrips[currentIndex + 1]);
				break;
			case ' ':
				event.preventDefault();
				playPause();
				break;
			case 'Home':
				event.preventDefault();
				selectTrip(visibleTrips[0]);
				break;
			case 'End':
				event.preventDefault();
				selectTrip(visibleTrips[visibleTrips.length - 1]);
				break;
		}
	}

	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	function formatSpeed(speed) {
		const value = typeof speed === 'number' ? speed : Number(speed);
		return (Number.isFinite(value) ? value : 0).toFixed(1);
	}

	function formatDateLabel(value) {
		return new Date(value).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatTimeLabel(value) {
		return new Date(value).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function reverseCoords(lat, lon) {
		return [lon, lat];
	}

	let currentTripStartLngLat = $derived.by(() => {
		const lat = currentTrip?.start_lat;
		const lon = currentTrip?.start_lon ?? currentTrip?.start_lng ?? currentTrip?.start_longitude;
		return Number.isFinite(lat) && Number.isFinite(lon) ? reverseCoords(lat, lon) : null;
	});

	let currentTripEndLngLat = $derived.by(() => {
		const lat = currentTrip?.end_lat;
		const lon = currentTrip?.end_lon ?? currentTrip?.end_lng ?? currentTrip?.end_longitude;
		return Number.isFinite(lat) && Number.isFinite(lon) ? reverseCoords(lat, lon) : null;
	});

	let currentTripLineCoordinates = $derived.by(() =>
		(currentTrip?.points ?? [])
			.filter((point) => typeof point.lon === 'number' && typeof point.lat === 'number')
			.map((point) => [point.lon, point.lat])
	);

	let tripStartMs = $derived.by(() =>
		currentTrip?.points?.length ? new Date(currentTrip.points[0].ts).getTime() : 0
	);
	let tripEndMs = $derived.by(() =>
		currentTrip?.points?.length
			? new Date(currentTrip.points[currentTrip.points.length - 1].ts).getTime()
			: 0
	);
	let playbackRatio = $derived.by(() => {
		if (!(tripEndMs > tripStartMs)) return 0;
		return Math.max(0, Math.min(1, (playbackTime - tripStartMs) / (tripEndMs - tripStartMs)));
	});
	let progressPercentage = $derived.by(() =>
		tripEndMs > tripStartMs ? ((playbackTime - tripStartMs) / (tripEndMs - tripStartMs)) * 100 : 0
	);
	let tripDuration = $derived.by(() =>
		tripEndMs > tripStartMs ? Math.floor((tripEndMs - tripStartMs) / 1000) : 0
	);
	let currentTime = $derived.by(() =>
		playbackTime && tripStartMs ? Math.max(0, Math.floor((playbackTime - tripStartMs) / 1000)) : 0
	);

	$effect(() => {
		if (tripEndMs > tripStartMs) {
			seekPosition = ((playbackTime - tripStartMs) / (tripEndMs - tripStartMs)) * 100;
		} else {
			seekPosition = 0;
		}
	});

	function getInterpolatedState(timeMs) {
		if (!currentTrip?.points?.length) return { lon: null, lat: null };
		const points = currentTrip.points;
		const start = new Date(points[0].ts).getTime();
		const end = new Date(points[points.length - 1].ts).getTime();
		if (timeMs <= start) return points[0];
		if (timeMs >= end) return points[points.length - 1];

		let index = 0;
		for (let i = 0; i < points.length - 1; i++) {
			const a = new Date(points[i].ts).getTime();
			const b = new Date(points[i + 1].ts).getTime();
			if (timeMs >= a && timeMs <= b) {
				index = i;
				break;
			}
		}

		const current = points[index];
		const next = points[index + 1];
		const startMs = new Date(current.ts).getTime();
		const endMs = new Date(next.ts).getTime();
		const ratio = Math.max(0, Math.min(1, (timeMs - startMs) / Math.max(1, endMs - startMs)));

		return {
			lon: current.lon + (next.lon - current.lon) * ratio,
			lat: current.lat + (next.lat - current.lat) * ratio
		};
	}

	function getNearestPacketSpeed(timeMs) {
		const points = currentTrip?.points ?? [];
		if (!points.length) return 0;
		if (points.length === 1) return Number(points[0].speed_kmh) || 0;

		const start = new Date(points[0].ts).getTime();
		const end = new Date(points[points.length - 1].ts).getTime();
		if (timeMs <= start) return Number(points[0].speed_kmh) || 0;
		if (timeMs >= end) return Number(points[points.length - 1].speed_kmh) || 0;

		let index = 0;
		for (let i = 0; i < points.length - 1; i++) {
			const a = new Date(points[i].ts).getTime();
			const b = new Date(points[i + 1].ts).getTime();
			if (timeMs >= a && timeMs <= b) {
				index = i;
				break;
			}
		}

		const a = new Date(points[index].ts).getTime();
		const b = new Date(points[index + 1].ts).getTime();
		const chosen = Math.abs(timeMs - a) <= Math.abs(b - timeMs) ? points[index] : points[index + 1];
		const value = Number(chosen?.speed_kmh);
		return Number.isFinite(value) ? value : 0;
	}

	let currentPointCoordinates = $derived.by(() => {
		if (snapToRoads && snappedCoordinates.length >= 2 && tripEndMs > tripStartMs) {
			const position = playbackRatio * (snappedCoordinates.length - 1);
			const index = Math.floor(position);
			if (index >= snappedCoordinates.length - 1) return snappedCoordinates[snappedCoordinates.length - 1];
			const fraction = Math.max(0, Math.min(1, position - index));
			const [x1, y1] = snappedCoordinates[index];
			const [x2, y2] = snappedCoordinates[index + 1];
			return [x1 + (x2 - x1) * fraction, y1 + (y2 - y1) * fraction];
		}

		const state = getInterpolatedState(playbackTime);
		return state.lon != null && state.lat != null ? [state.lon, state.lat] : null;
	});

	let currentSpeed = $derived.by(() => {
		const raw = getNearestPacketSpeed(playbackTime);
		const safe = Number.isFinite(raw) ? raw : 0;
		return safe <= 1 ? 0 : safe;
	});
	let speedPercent = $derived.by(() => Math.max(0, Math.min(currentSpeed, MAX_KMH)) / MAX_KMH);
	let dashOffset = $derived.by(() => GAUGE_C * (1 - speedPercent));

	let stopPoints = $derived.by(() => {
		const points = currentTrip?.points ?? [];
		if (points.length < 2) return [];

		const stops = [];
		let run = [];
		const toMs = (ts) => new Date(ts).getTime();

		for (let index = 0; index < points.length; index++) {
			const point = points[index];
			const speed = Number.isFinite(point?.speed_kmh) ? point.speed_kmh : 0;
			if (speed <= STOP_SPEED_KMH) {
				run.push(point);
			} else if (run.length) {
				const duration = Math.floor((toMs(run[run.length - 1].ts) - toMs(run[0].ts)) / 1000);
				if (duration >= STOP_MIN_DURATION_S) {
					const total = run.reduce(
						(sum, item) => ({ lon: sum.lon + (item.lon ?? 0), lat: sum.lat + (item.lat ?? 0) }),
						{ lon: 0, lat: 0 }
					);
					stops.push({
						lnglat: [total.lon / run.length, total.lat / run.length],
						durationSec: duration,
						start: run[0].ts,
						end: run[run.length - 1].ts
					});
				}
				run = [];
			}
		}

		if (run.length) {
			const duration = Math.floor((toMs(run[run.length - 1].ts) - toMs(run[0].ts)) / 1000);
			if (duration >= STOP_MIN_DURATION_S) {
				const total = run.reduce(
					(sum, item) => ({ lon: sum.lon + (item.lon ?? 0), lat: sum.lat + (item.lat ?? 0) }),
					{ lon: 0, lat: 0 }
				);
				stops.push({
					lnglat: [total.lon / run.length, total.lat / run.length],
					durationSec: duration,
					start: run[0].ts,
					end: run[run.length - 1].ts
				});
			}
		}

		return stops;
	});

	async function fetchSnappedLine(trip) {
		try {
			if (!trip?.points?.length) return [];
			const points = trip.points.filter((point) => Number.isFinite(point.lon) && Number.isFinite(point.lat));
			const maxPoints = 100;
			const step = Math.max(1, Math.floor(points.length / maxPoints));
			const reduced = points.filter((_, index) => index % step === 0);
			if (reduced[reduced.length - 1] !== points[points.length - 1]) reduced.push(points[points.length - 1]);

			const coords = reduced.map((point) => `${point.lon},${point.lat}`).join(';');
			const matchUrl = `https://router.project-osrm.org/match/v1/driving/${coords}?geometries=geojson&overview=full`;
			let response = await fetch(matchUrl);
			let result = [];

			if (response.ok) {
				const json = await response.json();
				result = json?.matchings?.[0]?.geometry?.coordinates ?? [];
			}

			if (!Array.isArray(result) || result.length < 2) {
				const routeUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full`;
				response = await fetch(routeUrl);
				if (response.ok) {
					const json = await response.json();
					result = json?.routes?.[0]?.geometry?.coordinates ?? [];
				}
			}

			return Array.isArray(result) && result.length >= 2 ? result : [];
		} catch {
			return [];
		}
	}

	$effect(async () => {
		if (snapToRoads && currentTrip) {
			snapping = true;
			snappedCoordinates = await fetchSnappedLine(currentTrip);
			snapping = false;
		} else {
			snappedCoordinates = [];
		}
	});

	let lineCoordinates = $derived.by(() =>
		snappedCoordinates.length >= 2 ? snappedCoordinates : currentTripLineCoordinates
	);
	let progressLineCoordinates = $derived.by(() => {
		if (!(tripEndMs > tripStartMs)) return [];

		if (snapToRoads && snappedCoordinates.length >= 2) {
			const position = playbackRatio * (snappedCoordinates.length - 1);
			const index = Math.floor(position);
			if (index >= snappedCoordinates.length - 1) return snappedCoordinates;
			const fraction = Math.max(0, Math.min(1, position - index));
			const [x1, y1] = snappedCoordinates[index];
			const [x2, y2] = snappedCoordinates[index + 1];
			const current = [x1 + (x2 - x1) * fraction, y1 + (y2 - y1) * fraction];
			return [...snappedCoordinates.slice(0, index + 1), current];
		}

		const points = currentTrip?.points ?? [];
		if (points.length < 2) return [];
		let index = 0;
		for (let i = 0; i < points.length - 1; i++) {
			const a = new Date(points[i].ts).getTime();
			const b = new Date(points[i + 1].ts).getTime();
			if (playbackTime >= a && playbackTime <= b) {
				index = i;
				break;
			}
		}
		const start = points[index];
		const end = points[index + 1];
		const startMs = new Date(start.ts).getTime();
		const endMs = new Date(end.ts).getTime();
		const ratio = Math.min(1, Math.max(0, (playbackTime - startMs) / Math.max(1, endMs - startMs)));
		return [
			...currentTripLineCoordinates.slice(0, index + 1),
			[start.lon + (end.lon - start.lon) * ratio, start.lat + (end.lat - start.lat) * ratio]
		];
	});

	let selectedTripNumber = $derived.by(() => {
		const index = visibleTrips.findIndex((trip) => trip.end_time === currentTrip?.end_time);
		return index >= 0 ? index + 1 : null;
	});
	let movingTripCount = $derived.by(() => data.trips.filter((trip) => trip.distance_km > 0).length);
	let totalDistance = $derived.by(() =>
		visibleTrips.reduce((sum, trip) => sum + (Number(trip.distance_km) || 0), 0).toFixed(1)
	);
	let tripStatusLabel = $derived.by(() => {
		if (!currentTrip) return 'No trip selected';
		if (isPlaying && currentSpeed > 0) return 'Replaying movement';
		if (isPlaying) return 'Replay paused in stop state';
		return 'Ready for replay';
	});
	let coverageLabel = $derived.by(() =>
		`${formatDateLabel(data.start_ts)} - ${formatDateLabel(data.end_ts)}`
	);

	$effect(() => {
		if (followPlayback) {
			if (currentPointCoordinates && currentPointCoordinates.length === 2) mapCenter = currentPointCoordinates;
			else if (currentTripStartLngLat) mapCenter = currentTripStartLngLat;
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-[#08101d] text-slate-100">
	<div class="border-b border-white/8 bg-[#0b1628]/95 backdrop-blur">
		<div class="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-4 lg:px-8">
			<div class="min-w-0">
				<div class="mb-2 flex items-center gap-3">
					<div class="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-cyan-300 uppercase">
						Omni Logistics Eye
					</div>
					<div class="text-[11px] tracking-[0.2em] text-slate-500 uppercase">Trip Operations</div>
				</div>
				<h1 class="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
					Replay telemetry like a dispatch workspace
				</h1>
				<p class="mt-1 max-w-3xl text-sm text-slate-400">
					Inspect historical routes, parking events, speed patterns, and asset movement without leaving the live map.
				</p>
			</div>

			<div class="hidden min-w-[360px] items-center justify-end gap-6 xl:flex">
				<div>
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Device</div>
					<div class="mt-1 text-sm font-medium text-white">{data.device_imei}</div>
				</div>
				<div>
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Coverage</div>
					<div class="mt-1 text-sm font-medium text-white">{coverageLabel}</div>
				</div>
				<div>
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Selected Trip</div>
					<div class="mt-1 text-sm font-medium text-white">
						{selectedTripNumber ? `Trip ${selectedTripNumber}` : currentTrip?.name ?? 'Combined selection'}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-[1600px] px-4 py-4 lg:px-8">
		<div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
			<aside class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
				<div class="border-b border-white/8 px-5 py-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Trip Queue</div>
							<h2 class="mt-1 text-lg font-semibold text-white">Historical runs</h2>
							<p class="mt-1 text-sm text-slate-400">
								{visibleTrips.length} visible of {movingTripCount} moving trips
							</p>
						</div>
						<button
							onclick={() => (showFilters = !showFilters)}
							class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
						>
							{showFilters ? 'Hide filters' : 'Show filters'}
						</button>
					</div>
				</div>

				{#if showFilters}
					<div class="grid gap-3 border-b border-white/8 px-5 py-4">
						<label class="grid gap-1.5">
							<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Date match</span>
							<input
								bind:value={dateFilter}
								type="text"
								placeholder="Aug 17 2025"
								class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
							/>
						</label>
						<label class="grid gap-1.5">
							<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Minimum distance</span>
							<input
								bind:value={distanceFilter}
								type="number"
								placeholder="0"
								class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
							/>
						</label>
						<label class="grid gap-1.5">
							<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Minimum max speed</span>
							<input
								bind:value={speedFilter}
								type="number"
								placeholder="0"
								class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
							/>
						</label>
					</div>
				{/if}

				<div class="border-b border-white/8 px-5 py-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Combined replay</div>
							<div class="mt-1 text-sm text-slate-300">Select consecutive trips and run them as one route.</div>
						</div>
						<label class="flex items-center gap-2 text-sm text-slate-300">
							<input type="checkbox" bind:checked={multiSelectMode} class="accent-cyan-400" />
							Span
						</label>
					</div>
					{#if selectedRange}
						<div class="mt-3 flex items-center gap-2">
							<button
								onclick={playCombinedSelection}
								class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
							>
								Replay selection
							</button>
							<button
								onclick={clearSelection}
								class="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
							>
								Clear
							</button>
						</div>
						<div class="mt-2 text-xs text-slate-400">
							Selected trips {selectedRange.s + 1} to {selectedRange.e + 1}
						</div>
					{/if}
				</div>

				<div class="max-h-[calc(100vh-360px)] overflow-y-auto px-3 py-3">
					{#if visibleTrips.length}
						<div class="space-y-2">
							{#each visibleTrips as trip, index}
								{@const isCurrentTrip = trip.end_time === currentTrip?.end_time}
								<div
									class={`rounded-2xl border px-4 py-3 transition ${
										isCurrentTrip
											? 'border-cyan-400/50 bg-cyan-400/10'
											: 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
									}`}
								>
									<button
										type="button"
										onclick={() => selectTrip(trip)}
										class="w-full text-left"
									>
										<div class="flex items-start justify-between gap-4">
											<div class="min-w-0">
												<div class="flex items-center gap-2">
													<div class="text-sm font-semibold text-white">Trip {index + 1}</div>
													{#if isCurrentTrip}
														<div class="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-cyan-300 uppercase">
															Selected
														</div>
													{/if}
												</div>
												<div class="mt-1 text-sm text-slate-300">{formatDateLabel(trip.start_time)}</div>
												<div class="text-xs text-slate-500">
													{formatTimeLabel(trip.start_time)} - {formatTimeLabel(trip.end_time)}
												</div>
											</div>
											<div class="text-right">
												<div class="text-sm font-semibold text-white">{trip.distance_km.toFixed(1)} km</div>
												<div class="text-xs text-slate-500">{trip.max_speed_kmh.toFixed(0)} km/h max</div>
											</div>
										</div>
									</button>

									<div class="mt-3 flex items-center justify-between gap-2">
										<div class="text-xs text-slate-500">
											Avg {trip.avg_moving_speed_kmh.toFixed(1)} km/h
										</div>
										<div class="flex items-center gap-2">
											<button
												onclick={(event) => {
													event.stopPropagation();
													toggleTripPlay(trip);
												}}
												class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
											>
												{isCurrentTrip && isPlaying ? 'Pause' : 'Play'}
											</button>
											<button
												onclick={(event) => {
													event.stopPropagation();
													previewTrip(trip);
												}}
												class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
											>
												Inspect
											</button>
											{#if multiSelectMode}
												<button
													onclick={(event) => {
													event.stopPropagation();
													toggleRangeTrip(trip);
												}}
													class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
												>
													Span
												</button>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="rounded-3xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-slate-500">
							No trips match the current filter set.
						</div>
					{/if}
				</div>
			</aside>

			<section class="overflow-hidden rounded-3xl border border-white/8 bg-[#0c1728]">
				<div class="border-b border-white/8 px-5 py-4">
					<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
						<div>
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Live workspace</div>
							<h2 class="mt-1 text-xl font-semibold text-white">
								{selectedTripNumber ? `Trip ${selectedTripNumber} replay` : currentTrip?.name ?? 'Combined replay'}
							</h2>
							<p class="mt-1 text-sm text-slate-400">{tripStatusLabel}</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<button
								onclick={gotoPrevTrip}
								class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
							>
								Previous
							</button>
							<button
								onclick={playPause}
								class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
							>
								{isPlaying ? 'Pause replay' : 'Start replay'}
							</button>
							<button
								onclick={gotoNextTrip}
								class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
							>
								Next
							</button>
						</div>
					</div>
				</div>

				<div class="relative h-[58vh] min-h-[460px]">
					<MapLibre
						bind:center={mapCenter}
						zoom={13}
						ondragstart={disableAutoFollow}
						class="h-full"
						style="https://tiles.openfreemap.org/styles/liberty"
					>
						{#if currentTrip}
							{#if lineCoordinates.length >= 2}
								<GeoJSONSource
									id="trip-line-src"
									data={{
										type: 'Feature',
										properties: {},
										geometry: { type: 'LineString', coordinates: lineCoordinates }
									}}
								>
									<LineLayer
										id="trip-line"
										source="trip-line-src"
										paint={{ 'line-color': '#33577d', 'line-width': 4, 'line-opacity': 0.95 }}
										layout={{ 'line-cap': 'round', 'line-join': 'round' }}
									/>
								</GeoJSONSource>

								{#if progressLineCoordinates.length >= 2}
									<GeoJSONSource
										id="trip-progress-src"
										data={{
											type: 'Feature',
											properties: {},
											geometry: { type: 'LineString', coordinates: progressLineCoordinates }
										}}
									>
										<LineLayer
											id="trip-progress"
											source="trip-progress-src"
											paint={{ 'line-color': '#4dd6ff', 'line-width': 6, 'line-opacity': 1 }}
											layout={{ 'line-cap': 'round', 'line-join': 'round' }}
										/>
									</GeoJSONSource>
								{/if}
							{/if}

							{#if stopPoints.length > 0}
								<GeoJSONSource
									id="stop-points-src"
									data={{
										type: 'FeatureCollection',
										features: stopPoints.map((stop) => ({
											type: 'Feature',
											properties: { durationSec: stop.durationSec },
											geometry: { type: 'Point', coordinates: stop.lnglat }
										}))
									}}
								>
									<CircleLayer
										id="stop-points"
										source="stop-points-src"
										paint={{
											'circle-color': '#f59e0b',
											'circle-radius': 7,
											'circle-stroke-color': '#fff7ed',
											'circle-stroke-width': 2
										}}
									/>
								</GeoJSONSource>
							{/if}

							{#if currentTripStartLngLat}
								<Marker lnglat={currentTripStartLngLat}>
									<div class="rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-black tracking-[0.22em] text-white shadow-2xl">
										START
									</div>
								</Marker>
							{/if}

							{#if currentTripEndLngLat}
								<Marker lnglat={currentTripEndLngLat}>
									<div class="rounded-full bg-rose-500 px-3 py-1.5 text-[10px] font-black tracking-[0.22em] text-white shadow-2xl">
										FINISH
									</div>
									<Popup class="border border-white/10 bg-slate-950 text-white">
										<div class="text-xs">
											<div class="font-semibold text-white">{currentTrip.distance_km.toFixed(1)} km</div>
											<div class="text-slate-400">{formatTime(tripDuration)}</div>
										</div>
									</Popup>
								</Marker>
							{/if}

							{#each stopPoints as stop}
								<Marker lnglat={stop.lnglat}>
									<div class="rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-slate-950 shadow-2xl">
										PARK {Math.round(stop.durationSec / 60)}M
									</div>
								</Marker>
							{/each}

							{#if currentPointCoordinates}
								<Marker lnglat={currentPointCoordinates}>
									<div class="relative">
										<div class="rounded-full bg-cyan-400 px-3 py-1.5 text-[10px] font-black tracking-[0.2em] text-slate-950 shadow-2xl">
											ASSET
										</div>
										<div class="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-cyan-100 shadow-xl">
											{formatSpeed(currentSpeed)} km/h
										</div>
									</div>
								</Marker>
							{/if}
						{/if}
					</MapLibre>

					<div class="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-4">
						<div class="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Map status</div>
							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
								<span class="rounded-full bg-white/5 px-2.5 py-1">Follow: {followPlayback ? 'On' : 'Off'}</span>
								<span class="rounded-full bg-white/5 px-2.5 py-1">Snap: {snapToRoads ? 'On' : 'Off'}</span>
								<span class="rounded-full bg-white/5 px-2.5 py-1">Stops: {stopPoints.length}</span>
							</div>
						</div>

						<div class="pointer-events-auto flex flex-col items-end gap-2">
							<button
								onclick={recenterMap}
								class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-xl transition hover:bg-slate-200"
							>
								Recenter asset
							</button>
							{#if !followPlayback}
								<div class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900 shadow-lg">
									Free map mode
								</div>
							{/if}
						</div>
					</div>

					<div class="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
						<div class="pointer-events-auto rounded-[2rem] border border-white/10 bg-slate-950/85 p-4 backdrop-blur">
							<div class="relative h-36 w-36">
								<svg viewBox="0 0 160 160" class="block h-36 w-36">
									<defs>
										<linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
											<stop offset="0%" stop-color="#1e3a5f" />
											<stop offset="100%" stop-color="#4dd6ff" />
										</linearGradient>
									</defs>
									<circle cx="80" cy="80" r={GAUGE_R} fill="none" stroke="#1e293b" stroke-width="12" />
									<g transform="rotate(-90 80 80)">
										<circle
											cx="80"
											cy="80"
											r={GAUGE_R}
											fill="none"
											stroke="url(#gaugeGradient)"
											stroke-width="12"
											stroke-linecap="round"
											style={`stroke-dasharray:${GAUGE_C};stroke-dashoffset:${dashOffset};transition:stroke-dashoffset 120ms linear;`}
										/>
									</g>
								</svg>
								<div class="absolute inset-0 flex flex-col items-center justify-center">
									<div class="text-3xl font-semibold text-white">{formatSpeed(currentSpeed)}</div>
									<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">km/h</div>
								</div>
							</div>
						</div>

						<div class="pointer-events-auto flex-1 rounded-[2rem] border border-white/10 bg-slate-950/85 px-5 py-4 backdrop-blur">
							<div class="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
								<div>{formatTime(currentTime)} elapsed</div>
								<div class="flex items-center gap-4">
									<label class="flex items-center gap-2 text-slate-300">
										<input
											type="checkbox"
											bind:checked={followPlayback}
											onchange={() => {
												if (followPlayback) recenterMap();
											}}
											class="accent-cyan-400"
										/>
										Follow asset
									</label>
									<label class="flex items-center gap-2 text-slate-300">
										<input
											type="checkbox"
											bind:checked={snapToRoads}
											class="accent-cyan-400"
										/>
										Snap to roads
									</label>
									<div>{formatTime(tripDuration)} total</div>
								</div>
							</div>

							<div class="flex items-center gap-3">
								<button
									onclick={resetPlayback}
									class="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
								>
									Reset
								</button>
								<button
									onclick={playPause}
									class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
								>
									{isPlaying ? 'Pause' : 'Play'}
								</button>
								<div class="flex-1">
									<input
										type="range"
										min="0"
										max="100"
										step="0.1"
										bind:value={seekPosition}
										oninput={(event) => seekToPosition(parseFloat(event.target.value))}
										class="slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
									/>
								</div>
								<select
									bind:value={playbackSpeed}
									class="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
								>
									{#each [0.25, 0.5, 1, 1.5, 2, 4, 8, 16, 32] as speed}
										<option value={speed}>{speed}x</option>
									{/each}
								</select>
							</div>

							<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
								<div
									class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 transition-all duration-200"
									style={`width:${progressPercentage}%`}
								></div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<aside class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
				<div class="border-b border-white/8 px-5 py-4">
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Trip inspector</div>
					<h2 class="mt-1 text-lg font-semibold text-white">
						{selectedTripNumber ? `Trip ${selectedTripNumber}` : currentTrip?.name ?? 'Combined replay'}
					</h2>
					<p class="mt-1 text-sm text-slate-400">Selected KPIs, timings, stops, and replay controls.</p>
				</div>

				<div class="space-y-6 px-5 py-5">
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Distance</div>
							<div class="mt-2 text-2xl font-semibold text-white">
								{currentTrip?.distance_km?.toFixed(1) ?? 0}
							</div>
							<div class="text-sm text-slate-400">Kilometres covered</div>
						</div>
						<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Max speed</div>
							<div class="mt-2 text-2xl font-semibold text-white">
								{currentTrip?.max_speed_kmh?.toFixed(1) ?? 0}
							</div>
							<div class="text-sm text-slate-400">km/h peak</div>
						</div>
						<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Duration</div>
							<div class="mt-2 text-2xl font-semibold text-white">{formatTime(tripDuration)}</div>
							<div class="text-sm text-slate-400">Replay window</div>
						</div>
						<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Avg speed</div>
							<div class="mt-2 text-2xl font-semibold text-white">
								{currentTrip?.avg_moving_speed_kmh?.toFixed(1) ?? 0}
							</div>
							<div class="text-sm text-slate-400">km/h moving average</div>
						</div>
					</div>

					<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
						<div class="flex items-center justify-between gap-3">
							<div>
								<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Selected KPIs</div>
								<div class="mt-1 text-base font-semibold text-white">Asset summary</div>
							</div>
							<div class="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
								{tripStatusLabel}
							</div>
						</div>

						<div class="mt-4 space-y-3 text-sm">
							<div class="flex items-center justify-between border-b border-white/6 pb-3">
								<span class="text-slate-400">Start</span>
								<span class="text-right text-white">
									{formatDateLabel(currentTrip.start_time)}<br />
									<span class="text-slate-500">{formatTimeLabel(currentTrip.start_time)}</span>
								</span>
							</div>
							<div class="flex items-center justify-between border-b border-white/6 pb-3">
								<span class="text-slate-400">Finish</span>
								<span class="text-right text-white">
									{formatDateLabel(currentTrip.end_time)}<br />
									<span class="text-slate-500">{formatTimeLabel(currentTrip.end_time)}</span>
								</span>
							</div>
							<div class="flex items-center justify-between border-b border-white/6 pb-3">
								<span class="text-slate-400">Moving seconds</span>
								<span class="text-white">{currentTrip?.moving_seconds ?? 0}s</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-slate-400">Stopped seconds</span>
								<span class="text-white">{currentTrip?.stopped_seconds ?? 0}s</span>
							</div>
						</div>
					</div>

					<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Parking events</div>
						<div class="mt-1 text-base font-semibold text-white">Detected stops</div>

						{#if stopPoints.length}
							<div class="mt-4 space-y-3">
								{#each stopPoints as stop, index}
									<div class="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3">
										<div class="flex items-center justify-between gap-3">
											<div class="text-sm font-medium text-white">Stop {index + 1}</div>
											<div class="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
												{Math.floor(stop.durationSec / 60)}m {stop.durationSec % 60}s
											</div>
										</div>
										<div class="mt-2 text-xs text-slate-400">
											{formatDateLabel(stop.start)} {formatTimeLabel(stop.start)} to {formatTimeLabel(stop.end)}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-500">
								No parking events were detected for this replay using the current stop threshold.
							</div>
						{/if}
					</div>

					<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Fleet scope</div>
						<div class="mt-1 text-base font-semibold text-white">Dataset context</div>
						<div class="mt-4 space-y-3 text-sm text-slate-400">
							<div class="flex items-center justify-between">
								<span>Total moving trips</span>
								<span class="text-white">{movingTripCount}</span>
							</div>
							<div class="flex items-center justify-between">
								<span>Visible trip distance</span>
								<span class="text-white">{totalDistance} km</span>
							</div>
							<div class="flex items-center justify-between">
								<span>Algorithm version</span>
								<span class="text-white">{data.algo_version}</span>
							</div>
							<div class="flex items-center justify-between">
								<span>Threshold</span>
								<span class="text-white">{data.threshold_minutes} min</span>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 18px;
		width: 18px;
		border-radius: 9999px;
		background: #4dd6ff;
		border: 2px solid rgba(255, 255, 255, 0.95);
		box-shadow: 0 0 0 4px rgba(77, 214, 255, 0.18);
	}

	.slider::-moz-range-thumb {
		height: 18px;
		width: 18px;
		border-radius: 9999px;
		background: #4dd6ff;
		border: 2px solid rgba(255, 255, 255, 0.95);
		box-shadow: 0 0 0 4px rgba(77, 214, 255, 0.18);
	}
</style>
