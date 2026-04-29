<script lang="ts">
	import { onMount } from 'svelte';

	import AlertList from '$lib/components/alerts/AlertList.svelte';
	import AssetList from '$lib/components/fleet/AssetList.svelte';
	import InspectorPanel from '$lib/components/inspector/InspectorPanel.svelte';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import FleetMap from '$lib/components/map/FleetMap.svelte';
	import TripList from '$lib/components/trips/TripList.svelte';
	import { getFleetWorkspace } from '$lib/api/mockTelemetry';
	import { LEFT_TABS } from '$lib/stores/workspace';
	import type {
		FleetAlert,
		FleetAsset,
		FleetWorkspaceData,
		InspectorContext,
		LeftTab,
		TripSummary,
		WorkspaceMode
	} from '$lib/types/telemetry';
	import {
		DEFAULT_MAP_CENTER,
		buildCombinedTrip,
		getInterpolatedState,
		getNearestPacketSpeed,
		getProgressLineCoordinates,
		getTripBounds,
		reverseCoords
	} from '$lib/utils/trips/playback';
	import { detectStopPoints } from '$lib/utils/trips/stops';
	import { formatDateLabel, formatTimeLabel } from '$lib/utils/telemetry/format';

	let loading = $state(true);
	let errorMessage = $state('');
	let workspace = $state<FleetWorkspaceData | null>(null);
	let workspaceMode = $state<WorkspaceMode>('live');
	let activeTab = $state<LeftTab>('assets');
	let inspectorContext = $state<InspectorContext>('asset');

	let selectedAssetId = $state<string | null>(null);
	let selectedAlertId = $state<string | null>(null);
	let currentTrip = $state<TripSummary | null>(null);

	let isPlaying = $state(false);
	let playbackSpeed = $state(1);
	let seekPosition = $state(0);
	let playbackTime = $state(0);
	let followPlayback = $state(true);
	let snapToRoads = $state(false);
	let snappedCoordinates = $state<[number, number][]>([]);
	let snapping = $state(false);
	let mapCenter = $state<[number, number]>(DEFAULT_MAP_CENTER);
	let rafId = 0;

	let showFilters = $state(true);
	let dateFilter = $state('');
	let distanceFilter = $state('');
	let speedFilter = $state('');
	let multiSelectMode = $state(false);
	let rangeStart = $state<number | null>(null);
	let rangeEnd = $state<number | null>(null);

	const replayableTrip = (trips: TripSummary[]) =>
		trips.find((trip) => trip.distance_km > 0 && (trip.points?.length ?? 0) > 1) ??
		trips[0] ??
		null;

	onMount(async () => {
		try {
			const response = await getFleetWorkspace();
			workspace = response.data;
			selectedAssetId = response.data.assets[0]?.id ?? null;
			const initialTrip = replayableTrip(response.data.assets[0]?.trips ?? []);
			currentTrip = initialTrip;
			playbackTime = initialTrip?.points?.length ? new Date(initialTrip.points[0].ts).getTime() : 0;
			mapCenter =
				reverseCoords(initialTrip?.start_lat, initialTrip?.start_lon) ?? DEFAULT_MAP_CENTER;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to load telemetry workspace.';
		} finally {
			loading = false;
		}
	});

	let assets = $derived.by(() => workspace?.assets ?? []);
	let alerts = $derived.by(() => workspace?.alerts ?? []);
	let selectedAsset = $derived.by(
		() => assets.find((asset) => asset.id === selectedAssetId) ?? assets[0] ?? null
	);
	let selectedAlert = $derived.by(
		() => alerts.find((alert) => alert.id === selectedAlertId) ?? null
	);

	let filteredTrips = $derived.by(() => {
		const trips = selectedAsset?.trips ?? [];
		return trips.filter((trip) => {
			if (dateFilter && !new Date(trip.start_time).toDateString().includes(dateFilter))
				return false;
			if (distanceFilter && trip.distance_km < parseFloat(distanceFilter)) return false;
			if (speedFilter && trip.max_speed_kmh < parseFloat(speedFilter)) return false;
			return true;
		});
	});
	let visibleTrips = $derived.by(() => filteredTrips.filter((trip) => trip.distance_km > 0));
	let selectedRange = $derived.by(() => {
		if (rangeStart == null) return null;
		const end = rangeEnd ?? rangeStart;
		return { s: Math.min(rangeStart, end), e: Math.max(rangeStart, end) };
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
		selectedAlertId = null;
		activeTab = 'assets';
		inspectorContext = 'asset';
		workspaceMode = 'live';
		clearSelection();
		stopPlayback();

		const nextTrip = replayableTrip(asset.trips);
		currentTrip = nextTrip;
		playbackTime = nextTrip?.points?.length ? new Date(nextTrip.points[0].ts).getTime() : 0;
		mapCenter = reverseCoords(asset.lat, asset.lon) ?? DEFAULT_MAP_CENTER;
	}

	function selectTrip(trip: TripSummary) {
		currentTrip = trip;
		playbackTime = trip?.points?.length ? new Date(trip.points[0].ts).getTime() : 0;
		seekPosition = 0;
		followPlayback = true;
		workspaceMode = 'replay';
		inspectorContext = 'trip';
		stopPlayback();
	}

	function previewTrip(trip: TripSummary) {
		selectTrip(trip);
	}

	function selectAlert(alert: FleetAlert) {
		selectedAlertId = alert.id;
		activeTab = 'alerts';
		inspectorContext = 'alert';
		workspaceMode = 'live';
		stopPlayback();

		const asset = assets.find((item) => item.id === alert.asset_id);
		if (asset) {
			selectedAssetId = asset.id;
			currentTrip =
				asset.trips.find((trip) => trip.id === alert.related_trip_id) ??
				replayableTrip(asset.trips);
			mapCenter = reverseCoords(asset.lat, asset.lon) ?? DEFAULT_MAP_CENTER;
		}
	}

	function clearSelection() {
		rangeStart = null;
		rangeEnd = null;
	}

	function toggleRangeTrip(trip: TripSummary) {
		const index = visibleTrips.findIndex((item) => item.id === trip.id);
		if (index < 0) return;
		if (rangeStart == null) {
			rangeStart = index;
			rangeEnd = index;
			return;
		}
		rangeEnd = index;
	}

	function playCombinedSelection() {
		if (!selectedRange || !selectedAsset) return;
		const combined = buildCombinedTrip(
			visibleTrips.slice(selectedRange.s, selectedRange.e + 1),
			selectedAsset.id
		);
		if (combined) selectTrip(combined);
	}

	function startPlayback() {
		if (!tripPoints.length) return;
		if (!(tripEndMs > tripStartMs)) return;
		if (!playbackTime || playbackTime < tripStartMs || playbackTime > tripEndMs) {
			playbackTime = tripStartMs;
		}

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

	function toggleTripPlay(trip: TripSummary) {
		const isCurrent = currentTrip?.id === trip.id;
		if (isCurrent && isPlaying) {
			stopPlayback();
			return;
		}
		if (!isCurrent) selectTrip(trip);
		startPlayback();
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

	function handleKeydown(event: KeyboardEvent) {
		if (!visibleTrips.length) return;
		const currentIndex = visibleTrips.findIndex((trip) => trip.id === currentTrip?.id);

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
				if (visibleTrips[0]) selectTrip(visibleTrips[0]);
				break;
			case 'End':
				event.preventDefault();
				if (visibleTrips[visibleTrips.length - 1])
					selectTrip(visibleTrips[visibleTrips.length - 1]);
				break;
		}
	}

	let currentPointCoordinates = $derived.by(() => {
		if (workspaceMode === 'live') {
			return reverseCoords(selectedAsset?.lat, selectedAsset?.lon);
		}

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
		if (workspaceMode === 'live') {
			return selectedAsset?.speed_kmh ?? 0;
		}
		const raw = getNearestPacketSpeed(tripPoints, playbackTime);
		return raw <= 1 ? 0 : raw;
	});
	let lineCoordinates = $derived.by(() =>
		snappedCoordinates.length >= 2 ? snappedCoordinates : currentTripLineCoordinates
	);
	let progressLineCoordinates = $derived.by(() => {
		if (workspaceMode === 'live') return [];
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
</script>

<svelte:window on:keydown={handleKeydown} />

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-[#06101b] px-4">
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] px-8 py-10 text-center">
			<div class="text-sm font-medium text-cyan-300">Loading fleet telemetry workspace...</div>
			<div class="mt-2 text-sm text-slate-400">
				Preparing assets, trips, alerts, and replay context.
			</div>
		</div>
	</div>
{:else if errorMessage}
	<div class="flex min-h-screen items-center justify-center bg-[#06101b] px-4">
		<div
			class="max-w-xl rounded-3xl border border-rose-400/20 bg-rose-400/8 px-8 py-10 text-center"
		>
			<div class="text-lg font-semibold text-white">Workspace failed to load</div>
			<div class="mt-2 text-sm text-slate-300">{errorMessage}</div>
		</div>
	</div>
{:else if workspace}
	<AppShell
		hub={workspace.hub}
		summary={workspace.summary}
		mode={workspaceMode}
		onModeChange={(mode) => {
			workspaceMode = mode;
			inspectorContext = mode === 'replay' ? 'trip' : 'asset';
			if (mode === 'live') stopPlayback();
		}}
	>
		{#snippet left()}
			<aside class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
				<div class="border-b border-white/8 px-5 py-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
								Operations rail
							</div>
							<h2 class="mt-1 text-lg font-semibold text-white">Fleet context</h2>
							<p class="mt-1 text-sm text-slate-400">
								Assets first, with trips and alerts one click away.
							</p>
						</div>
						<div class="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
							{workspace.hub.name}
						</div>
					</div>
				</div>

				<div class="border-b border-white/8 p-3">
					<div class="grid grid-cols-4 gap-2">
						{#each LEFT_TABS as tab}
							<button
								type="button"
								onclick={() => (activeTab = tab)}
								class={`rounded-2xl px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition ${
									activeTab === tab
										? 'bg-cyan-400 text-slate-950'
										: 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white'
								}`}
							>
								{tab}
							</button>
						{/each}
					</div>
				</div>

				{#if activeTab === 'assets'}
					<div class="border-b border-white/8 px-5 py-4">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Assets</div>
						<div class="mt-1 text-sm text-slate-300">
							{workspace.summary.total_assets} assets across moving, parked, idle, and offline states.
						</div>
					</div>
					<div class="max-h-[calc(100vh-320px)] overflow-y-auto px-3 py-3">
						<AssetList {assets} selectedAssetId={selectedAsset?.id} onSelect={selectAsset} />
					</div>
				{:else if activeTab === 'trips'}
					<div class="border-b border-white/8 px-5 py-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Trip queue</div>
								<h2 class="mt-1 text-lg font-semibold text-white">Historical runs</h2>
								<p class="mt-1 text-sm text-slate-400">
									{visibleTrips.length} visible trip{visibleTrips.length === 1 ? '' : 's'} for{' '}
									{selectedAsset?.name ?? 'selected asset'}
								</p>
							</div>
							<button
								type="button"
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
								<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase"
									>Date match</span
								>
								<input
									bind:value={dateFilter}
									type="text"
									placeholder={formatDateLabel(workspace.meta.start_ts)}
									class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
								/>
							</label>
							<label class="grid gap-1.5">
								<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase"
									>Minimum distance</span
								>
								<input
									bind:value={distanceFilter}
									type="number"
									placeholder="0"
									class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
								/>
							</label>
							<label class="grid gap-1.5">
								<span class="text-[11px] tracking-[0.18em] text-slate-500 uppercase"
									>Minimum max speed</span
								>
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
								<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
									Combined replay
								</div>
								<div class="mt-1 text-sm text-slate-300">
									Select consecutive trips and replay them as one route.
								</div>
							</div>
							<label class="flex items-center gap-2 text-sm text-slate-300">
								<input type="checkbox" bind:checked={multiSelectMode} class="accent-cyan-400" />
								Span
							</label>
						</div>
					</div>

					<div class="max-h-[calc(100vh-420px)] overflow-y-auto px-3 py-3">
						<TripList
							trips={visibleTrips}
							selectedTripId={currentTrip?.id}
							{selectedRange}
							{multiSelectMode}
							{isPlaying}
							onSelect={selectTrip}
							onPreview={previewTrip}
							onTogglePlay={toggleTripPlay}
							onToggleRange={toggleRangeTrip}
							onPlayCombined={playCombinedSelection}
							onClearSelection={clearSelection}
						/>
					</div>
				{:else if activeTab === 'alerts'}
					<div class="border-b border-white/8 px-5 py-4">
						<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Alerts</div>
						<div class="mt-1 text-sm text-slate-300">
							{workspace.summary.active_alerts} active fleet alerts need attention.
						</div>
					</div>
					<div class="max-h-[calc(100vh-320px)] overflow-y-auto px-3 py-3">
						<AlertList
							{alerts}
							selectedAlertId={selectedAlertId ?? undefined}
							onSelect={selectAlert}
						/>
					</div>
				{:else}
					<div class="px-5 py-6">
						<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Drivers</div>
							<div class="mt-4 space-y-3">
								{#each workspace.drivers as driver}
									<div class="rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3">
										<div class="flex items-center justify-between gap-3">
											<div>
												<div class="text-sm font-medium text-white">{driver.name}</div>
												<div class="mt-1 text-xs text-slate-400">
													{driver.asset_id ? 'Assigned to active asset' : 'Available'}
												</div>
											</div>
											<div
												class="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase"
											>
												{driver.status}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</aside>
		{/snippet}

		{#snippet center()}
			<FleetMap
				mode={workspaceMode}
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
				onMapDragStart={disableAutoFollow}
				onRecenter={recenterMap}
				onToggleFollow={toggleFollow}
				onToggleSnap={toggleSnap}
				onReset={resetPlayback}
				onPlayPause={playPause}
				onSeek={seekToPosition}
				onSpeedChange={(value) => (playbackSpeed = value)}
			/>
		{/snippet}

		{#snippet right()}
			<InspectorPanel
				context={inspectorContext}
				asset={selectedAsset}
				trip={currentTrip}
				alert={selectedAlert}
				{stopPoints}
				reports={workspace.reports}
				fleetMeta={workspace.meta}
			/>
		{/snippet}
	</AppShell>
{/if}
