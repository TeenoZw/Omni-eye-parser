<script lang="ts">
	import FleetMap from '$lib/components/map/FleetMap.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type {
		FleetAsset,
		FleetWorkspaceData,
		TelemetryPoint,
		TripSummary
	} from '$lib/types/telemetry';
	import {
		DEFAULT_MAP_CENTER,
		buildPlaybackWindowTrip,
		getInterpolatedState,
		getNearestPacketSpeed,
		getProgressLineCoordinates,
		getTripBounds,
		reverseCoords
	} from '$lib/utils/trips/playback';
	import { detectStopPoints } from '$lib/utils/trips/stops';
	import { formatDateLabel, formatDuration, formatTimeLabel } from '$lib/utils/telemetry/format';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();

	let selectedAssetId = $state(workspace.assets[0]?.id ?? null);
	let selectedAsset = $derived.by(
		() =>
			workspace.assets.find((asset) => asset.id === selectedAssetId) ?? workspace.assets[0] ?? null
	);
	let isPlaying = $state(false);
	let playbackSpeed = $state(1);
	let seekPosition = $state(0);
	let playbackTime = $state(0);
	let followPlayback = $state(true);
	let snapToRoads = $state(false);
	let snappedCoordinates = $state<[number, number][]>([]);
	let snapping = $state(false);
	let mapCenter = $state<[number, number]>(DEFAULT_MAP_CENTER);
	let selectedDate = $state('');
	let selectedStartTime = $state('00:00');
	let selectedEndTime = $state('23:59');
	let activeWindowKey = $state('');
	let rafId = 0;

	function getReplayableTrip(asset: FleetAsset | null) {
		return (
			asset?.trips.find((trip) => trip.distance_km > 0 && (trip.points?.length ?? 0) > 1) ??
			asset?.trips[0] ??
			null
		);
	}

	function getDefaultWindow(asset: FleetAsset | null) {
		const trip = getReplayableTrip(asset);
		const firstPoint = trip?.points?.[0];
		const lastPoint = trip?.points?.[trip.points.length - 1];
		const date = (firstPoint?.ts ?? workspace.meta.start_ts).slice(0, 10);
		return {
			date,
			startTime: (firstPoint?.ts ?? workspace.meta.start_ts).slice(11, 16),
			endTime: (lastPoint?.ts ?? workspace.meta.end_ts).slice(11, 16)
		};
	}

	function toUtcMs(date: string, time: string) {
		return new Date(`${date}T${time}:00Z`).getTime();
	}

	function setWindowFromAsset(asset: FleetAsset | null) {
		const defaults = getDefaultWindow(asset);
		selectedDate = defaults.date;
		selectedStartTime = defaults.startTime;
		selectedEndTime = defaults.endTime;
	}

	$effect(() => {
		if (selectedAsset && !selectedDate) {
			setWindowFromAsset(selectedAsset);
			mapCenter = reverseCoords(selectedAsset.lat, selectedAsset.lon) ?? DEFAULT_MAP_CENTER;
		}
	});

	let assetPoints = $derived.by(() => {
		const seen = new Map<string, TelemetryPoint>();
		for (const point of selectedAsset?.trips.flatMap((trip) => trip.points ?? []) ?? []) {
			if (!seen.has(point.ts)) seen.set(point.ts, point);
		}
		return [...seen.values()].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
	});

	let availableDates = $derived.by(() =>
		[...new Set(assetPoints.map((point) => point.ts.slice(0, 10)))].sort()
	);

	let windowStartMs = $derived.by(() => toUtcMs(selectedDate, selectedStartTime));
	let windowEndMs = $derived.by(() => toUtcMs(selectedDate, selectedEndTime));
	let normalizedWindowEndMs = $derived.by(() =>
		windowEndMs >= windowStartMs ? windowEndMs : windowStartMs
	);

	let windowPoints = $derived.by(() =>
		assetPoints.filter((point) => {
			const time = new Date(point.ts).getTime();
			return time >= windowStartMs && time <= normalizedWindowEndMs;
		})
	);

	let intersectingTrips = $derived.by(() =>
		(selectedAsset?.trips ?? []).filter((trip) => {
			const start = new Date(trip.start_time).getTime();
			const end = new Date(trip.end_time).getTime();
			return start <= normalizedWindowEndMs && end >= windowStartMs && trip.distance_km > 0;
		})
	);

	let currentTrip = $derived.by<TripSummary | null>(() => {
		if (!selectedAsset || windowPoints.length < 2) return null;
		return buildPlaybackWindowTrip(
			windowPoints,
			selectedAsset.id,
			`${formatDateLabel(`${selectedDate}T00:00:00Z`)} ${selectedStartTime} - ${selectedEndTime}`,
			selectedAsset.current_geofence ?? 'Window start',
			selectedAsset.location_label ?? 'Window end'
		);
	});

	let tripPoints = $derived.by(() => currentTrip?.points ?? []);
	let tripStartMs = $derived.by(() => getTripBounds(currentTrip).tripStartMs);
	let tripEndMs = $derived.by(() => getTripBounds(currentTrip).tripEndMs);
	let currentTripStartLngLat = $derived.by(() =>
		reverseCoords(currentTrip?.start_lat, currentTrip?.start_lon)
	);
	let currentTripEndLngLat = $derived.by(() =>
		reverseCoords(currentTrip?.end_lat, currentTrip?.end_lon)
	);
	let currentTripLineCoordinates = $derived.by(() =>
		tripPoints
			.filter((point) => typeof point.lon === 'number' && typeof point.lat === 'number')
			.map((point) => [point.lon, point.lat] as [number, number])
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
	let stopPoints = $derived.by(() => detectStopPoints(tripPoints));

	$effect(() => {
		const nextKey = currentTrip
			? `${currentTrip.start_time}_${currentTrip.end_time}_${tripPoints.length}`
			: `empty_${selectedDate}_${selectedStartTime}_${selectedEndTime}`;
		if (nextKey === activeWindowKey) return;

		activeWindowKey = nextKey;
		stopPlayback();
		playbackTime = tripStartMs;
		seekPosition = 0;
		followPlayback = true;
		const fallback = reverseCoords(selectedAsset?.lat, selectedAsset?.lon) ?? DEFAULT_MAP_CENTER;
		mapCenter = currentTripStartLngLat ?? fallback;
	});

	$effect(() => {
		if (tripEndMs > tripStartMs) {
			seekPosition = ((playbackTime - tripStartMs) / (tripEndMs - tripStartMs)) * 100;
		} else {
			seekPosition = 0;
		}
	});

	$effect(() => {
		if (followPlayback) {
			const center =
				currentPointCoordinates ??
				currentTripStartLngLat ??
				reverseCoords(selectedAsset?.lat, selectedAsset?.lon);
			if (center) mapCenter = center;
		}
	});

	$effect(() => {
		if (snapToRoads && currentTrip?.points?.length) {
			snapping = true;
			void (async () => {
				snappedCoordinates = await fetchSnappedLine(currentTrip);
				snapping = false;
			})();
			return;
		}

		snappedCoordinates = [];
		snapping = false;
	});

	function stopPlayback() {
		isPlaying = false;
		if (rafId) cancelAnimationFrame(rafId);
		rafId = 0;
	}

	function selectAsset(asset: FleetAsset) {
		selectedAssetId = asset.id;
		stopPlayback();
		setWindowFromAsset(asset);
		mapCenter = reverseCoords(asset.lat, asset.lon) ?? DEFAULT_MAP_CENTER;
	}

	function setWholeDayWindow() {
		selectedStartTime = '00:00';
		selectedEndTime = '23:59';
	}

	function useStoredTripSpan() {
		const trip = getReplayableTrip(selectedAsset);
		if (!trip) return;
		selectedDate = trip.start_time.slice(0, 10);
		selectedStartTime = trip.start_time.slice(11, 16);
		selectedEndTime = trip.end_time.slice(11, 16);
	}

	function startPlayback() {
		if (!tripPoints.length) return;
		if (!(tripEndMs > tripStartMs)) return;
		if (!playbackTime || playbackTime < tripStartMs || playbackTime > tripEndMs)
			playbackTime = tripStartMs;

		isPlaying = true;
		let last = performance.now();
		const loop = (now: number) => {
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

	function playPause() {
		if (isPlaying) stopPlayback();
		else startPlayback();
	}

	function resetPlayback() {
		stopPlayback();
		playbackTime = tripStartMs;
		seekPosition = 0;
	}

	function seekToPosition(position: number) {
		if (!(tripEndMs > tripStartMs)) return;
		playbackTime = tripStartMs + (position / 100) * (tripEndMs - tripStartMs);
		seekPosition = position;
	}

	function recenterMap() {
		const fallback = reverseCoords(selectedAsset?.lat, selectedAsset?.lon) ?? DEFAULT_MAP_CENTER;
		mapCenter = currentPointCoordinates ?? currentTripStartLngLat ?? fallback;
		followPlayback = true;
	}

	function disableAutoFollow() {
		followPlayback = false;
	}

	function toggleFollow() {
		followPlayback = !followPlayback;
		if (followPlayback) recenterMap();
	}

	function toggleSnap() {
		snapToRoads = !snapToRoads;
	}

	let currentPointCoordinates = $derived.by(() => {
		if (snapToRoads && snappedCoordinates.length >= 2 && tripEndMs > tripStartMs) {
			const position = playbackRatio * (snappedCoordinates.length - 1);
			const index = Math.floor(position);
			if (index >= snappedCoordinates.length - 1)
				return snappedCoordinates[snappedCoordinates.length - 1];
			const fraction = Math.max(0, Math.min(1, position - index));
			const [x1, y1] = snappedCoordinates[index];
			const [x2, y2] = snappedCoordinates[index + 1];
			return [x1 + (x2 - x1) * fraction, y1 + (y2 - y1) * fraction] as [number, number];
		}

		const state = getInterpolatedState(tripPoints, playbackTime);
		return state.lon != null && state.lat != null
			? ([state.lon, state.lat] as [number, number])
			: null;
	});
	let currentSpeed = $derived.by(() => {
		const raw = getNearestPacketSpeed(tripPoints, playbackTime);
		return raw <= 1 ? 0 : raw;
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
			const current = [x1 + (x2 - x1) * fraction, y1 + (y2 - y1) * fraction] as [number, number];
			return [...snappedCoordinates.slice(0, index + 1), current];
		}
		return getProgressLineCoordinates(tripPoints, playbackTime, currentTripLineCoordinates);
	});

	async function fetchSnappedLine(trip: TripSummary) {
		try {
			if (!trip?.points?.length) return [];
			const points = trip.points.filter(
				(point) => Number.isFinite(point.lon) && Number.isFinite(point.lat)
			);
			const maxPoints = 100;
			const step = Math.max(1, Math.floor(points.length / maxPoints));
			const reduced = points.filter((_, index) => index % step === 0);
			if (reduced[reduced.length - 1] !== points[points.length - 1])
				reduced.push(points[points.length - 1]);

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

	function handleKeydown(event: KeyboardEvent) {
		if (!currentTrip) return;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				seekToPosition(Math.max(0, seekPosition - 5));
				break;
			case 'ArrowRight':
				event.preventDefault();
				seekToPosition(Math.min(100, seekPosition + 5));
				break;
			case ' ':
				event.preventDefault();
				playPause();
				break;
			case 'Home':
				event.preventDefault();
				seekToPosition(0);
				break;
			case 'End':
				event.preventDefault();
				seekToPosition(100);
				break;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="space-y-4">
	<PageHeader
		eyebrow="Playback"
		title="Historical trip replay"
		description="Pick an asset, date, and time span, then replay the exact telemetry window you want from a dedicated historical workspace."
	/>

	<section class="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
		<div class="grid gap-3 xl:grid-cols-[220px_160px_150px_150px_minmax(0,1fr)]">
			<label class="grid gap-1.5">
				<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Vehicle</span>
				<select
					value={selectedAssetId ?? ''}
					onchange={(event) => {
						const asset = workspace.assets.find(
							(item) => item.id === (event.currentTarget as HTMLSelectElement).value
						);
						if (asset) selectAsset(asset);
					}}
					class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none"
				>
					{#each workspace.assets as asset}
						<option value={asset.id}>{asset.name} · {asset.registration}</option>
					{/each}
				</select>
			</label>
			<label class="grid gap-1.5">
				<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Date</span>
				<input
					bind:value={selectedDate}
					type="date"
					min={availableDates[0]}
					max={availableDates[availableDates.length - 1]}
					class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none"
				/>
			</label>
			<label class="grid gap-1.5">
				<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Start</span>
				<input
					bind:value={selectedStartTime}
					type="time"
					step="60"
					class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none"
				/>
			</label>
			<label class="grid gap-1.5">
				<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">End</span>
				<input
					bind:value={selectedEndTime}
					type="time"
					step="60"
					class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none"
				/>
			</label>
			<div class="grid gap-1.5">
				<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Range helpers</span>
				<div class="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onclick={useStoredTripSpan}
						class="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:text-white"
					>
						Last replayable span
					</button>
					<button
						type="button"
						onclick={setWholeDayWindow}
						class="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:text-white"
					>
						Whole day
					</button>
					<div class="rounded-full bg-white/5 px-3 py-2 text-xs text-slate-400">
						UTC telemetry window
					</div>
				</div>
			</div>
		</div>
		<div class="mt-3 flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={playPause}
				disabled={!currentTrip}
				class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
			>
				{isPlaying ? 'Pause replay' : 'Start replay'}
			</button>
			<button
				type="button"
				onclick={resetPlayback}
				disabled={!currentTrip}
				class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:text-slate-500"
			>
				Reset
			</button>
			<div class="rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
				{windowPoints.length} packets in window
			</div>
			<div class="rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
				{intersectingTrips.length} derived trip spans touched
			</div>
			<div class="ml-auto rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
				Keyboard: left/right seek, space plays
			</div>
		</div>
	</section>

	<div>
		<FleetMap
			mode="replay"
			{selectedAsset}
			{currentTrip}
			{mapCenter}
			{lineCoordinates}
			{progressLineCoordinates}
			{currentPointCoordinates}
			{currentTripStartLngLat}
			{currentTripEndLngLat}
			{stopPoints}
			{currentSpeed}
			{tripDuration}
			{currentTime}
			{progressPercentage}
			{seekPosition}
			{playbackSpeed}
			{isPlaying}
			{followPlayback}
			{snapToRoads}
			{snapping}
			leftOverlayWidthClass="w-[220px]"
			rightOverlayWidthClass="w-[216px]"
			onMapDragStart={disableAutoFollow}
			onRecenter={recenterMap}
			onToggleFollow={toggleFollow}
			onToggleSnap={toggleSnap}
			onReset={resetPlayback}
			onPlayPause={playPause}
			onSeek={seekToPosition}
			onSpeedChange={(value) => (playbackSpeed = value)}
		>
			{#snippet leftOverlay()}
				<div class="flex h-full flex-col">
					<div class="border-b border-white/8 px-3 py-3">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Window</div>
						<div class="mt-1 text-sm text-slate-200">{selectedDate || 'No date selected'}</div>
						<div class="text-xs text-slate-400">{selectedStartTime} to {selectedEndTime}</div>
					</div>

					<div class="grid grid-cols-2 gap-2 border-b border-white/8 px-3 py-3">
						<div class="rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2">
							<div class="text-[10px] tracking-[0.14em] text-slate-500 uppercase">Packets</div>
							<div class="mt-1 text-sm font-semibold text-white">{windowPoints.length}</div>
						</div>
						<div class="rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2">
							<div class="text-[10px] tracking-[0.14em] text-slate-500 uppercase">Stops</div>
							<div class="mt-1 text-sm font-semibold text-white">{stopPoints.length}</div>
						</div>
					</div>

					<div class="border-b border-white/8 px-3 py-3">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Trip hints</div>
						<div class="mt-2 space-y-1.5">
							{#if intersectingTrips.length}
								{#each intersectingTrips.slice(0, 5) as trip, index}
									<div class="rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2">
										<div class="flex items-center justify-between gap-2">
											<div class="text-[12px] font-medium text-white">Segment {index + 1}</div>
											<div class="text-[11px] text-slate-400">{trip.distance_km.toFixed(1)} km</div>
										</div>
										<div class="mt-1 text-[11px] text-slate-500">
											{formatTimeLabel(trip.start_time)} to {formatTimeLabel(trip.end_time)}
										</div>
									</div>
								{/each}
							{:else}
								<div
									class="rounded-xl border border-dashed border-white/10 px-3 py-4 text-[11px] text-slate-500"
								>
									No stored trip boundaries intersect this custom window.
								</div>
							{/if}
						</div>
					</div>

					<div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Detected stops</div>
						<div class="mt-2 space-y-1.5">
							{#if stopPoints.length}
								{#each stopPoints as stop}
									<div class="rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2">
										<div class="text-[12px] font-medium text-white">{stop.label}</div>
										<div class="mt-1 text-[11px] text-slate-500">
											{formatTimeLabel(stop.start)} to {formatTimeLabel(stop.end)}
										</div>
									</div>
								{/each}
							{:else}
								<div
									class="rounded-xl border border-dashed border-white/10 px-3 py-4 text-[11px] text-slate-500"
								>
									No stop events detected inside this selected window.
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/snippet}

			{#snippet rightOverlay()}
				<div class="flex h-full flex-col">
					<div class="border-b border-white/8 px-3 py-3">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
							Playback inspector
						</div>
						<div class="mt-1 text-sm text-slate-200">
							{selectedAsset?.name ?? 'No asset selected'}
						</div>
						<div class="text-xs text-slate-400">
							{currentTrip ? 'Custom telemetry window' : 'Pick a valid window to replay'}
						</div>
					</div>

					{#if currentTrip}
						<div class="grid grid-cols-2 gap-2 px-3 py-3">
							<div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
								<div class="text-[10px] tracking-[0.14em] text-slate-500 uppercase">Distance</div>
								<div class="mt-1 text-xl font-semibold text-white">
									{currentTrip.distance_km.toFixed(1)}
								</div>
								<div class="text-xs text-slate-500">Kilometres</div>
							</div>
							<div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
								<div class="text-[10px] tracking-[0.14em] text-slate-500 uppercase">Max speed</div>
								<div class="mt-1 text-xl font-semibold text-white">
									{currentTrip.max_speed_kmh.toFixed(0)}
								</div>
								<div class="text-xs text-slate-500">km/h</div>
							</div>
						</div>

						<div class="space-y-2 px-3 pb-3">
							<div class="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
								<div class="text-[10px] tracking-[0.14em] text-slate-500 uppercase">Duration</div>
								<div class="mt-1 text-base font-semibold text-white">
									{formatDuration(tripDuration)}
								</div>
								<div class="mt-1 flex items-center justify-between text-[11px] text-slate-500">
									<span>{formatTimeLabel(currentTrip.start_time)}</span>
									<span>{formatTimeLabel(currentTrip.end_time)}</span>
								</div>
							</div>

							<div class="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
								<div class="flex items-center justify-between text-[11px] text-slate-500">
									<span>Moving</span>
									<span>{formatDuration(currentTrip.moving_seconds)}</span>
								</div>
								<div class="mt-2 flex items-center justify-between text-[11px] text-slate-500">
									<span>Stopped</span>
									<span>{formatDuration(currentTrip.stopped_seconds)}</span>
								</div>
								<div class="mt-2 flex items-center justify-between text-[11px] text-slate-500">
									<span>Average</span>
									<span>{currentTrip.avg_moving_speed_kmh.toFixed(1)} km/h</span>
								</div>
								<div class="mt-2 flex items-center justify-between text-[11px] text-slate-500">
									<span>Overspeed packets</span>
									<span>{currentTrip.overspeed_event_count ?? 0}</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="px-3 py-3">
							<div
								class="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500"
							>
								The selected date and time range does not contain enough telemetry points to build a
								replay route.
							</div>
						</div>
					{/if}
				</div>
			{/snippet}
		</FleetMap>
	</div>
</div>
