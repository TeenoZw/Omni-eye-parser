<script lang="ts">
	import {
		CircleLayer,
		GeoJSONSource,
		LineLayer,
		MapLibre,
		Marker,
		Popup
	} from 'svelte-maplibre-gl';

	import MapToolbar from '$lib/components/map/MapToolbar.svelte';
	import TripReplayControls from '$lib/components/trips/TripReplayControls.svelte';
	import type { FleetAsset, StopPoint, TripSummary, WorkspaceMode } from '$lib/types/telemetry';
	import { formatDuration, formatSpeed } from '$lib/utils/telemetry/format';

	let {
		mode,
		selectedAsset,
		currentTrip,
		mapCenter,
		lineCoordinates,
		progressLineCoordinates,
		currentPointCoordinates,
		currentTripStartLngLat,
		currentTripEndLngLat,
		stopPoints,
		currentSpeed,
		tripDuration,
		currentTime,
		progressPercentage,
		seekPosition,
		playbackSpeed,
		isPlaying,
		followPlayback,
		snapToRoads,
		snapping,
		onMapDragStart,
		onRecenter,
		onToggleFollow,
		onToggleSnap,
		onReset,
		onPlayPause,
		onSeek,
		onSpeedChange
	}: {
		mode: WorkspaceMode;
		selectedAsset: FleetAsset | null;
		currentTrip: TripSummary | null;
		mapCenter: [number, number];
		lineCoordinates: [number, number][];
		progressLineCoordinates: [number, number][];
		currentPointCoordinates: [number, number] | null;
		currentTripStartLngLat: [number, number] | null;
		currentTripEndLngLat: [number, number] | null;
		stopPoints: StopPoint[];
		currentSpeed: number;
		tripDuration: number;
		currentTime: number;
		progressPercentage: number;
		seekPosition: number;
		playbackSpeed: number;
		isPlaying: boolean;
		followPlayback: boolean;
		snapToRoads: boolean;
		snapping: boolean;
		onMapDragStart: () => void;
		onRecenter: () => void;
		onToggleFollow: () => void;
		onToggleSnap: () => void;
		onReset: () => void;
		onPlayPause: () => void;
		onSeek: (value: number) => void;
		onSpeedChange: (value: number) => void;
	} = $props();
</script>

<section class="overflow-hidden rounded-3xl border border-white/8 bg-[#0c1728]">
	<div class="border-b border-white/8 px-4 py-3">
		<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
			<div>
				<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Map workspace</div>
				<div class="mt-1 flex flex-wrap items-center gap-2">
					<h2 class="text-lg font-semibold text-white">{selectedAsset?.name ?? 'Fleet map'}</h2>
					<div class="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 uppercase">
						{mode}
					</div>
				</div>
				<p class="mt-1 text-sm text-slate-400">
					{mode === 'live'
						? 'Track current asset context and operational status on the shared fleet map.'
						: 'Inspect route progress, stops, and trip timing without leaving the operations workspace.'}
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<div class="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300">
					{selectedAsset?.registration ?? 'No asset'}
				</div>
				{#if currentTrip}
					<div class="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
						{currentTrip.distance_km.toFixed(1)} km
					</div>
				{/if}
				{#if snapping}
					<div class="rounded-full bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
						Snapping route
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="relative h-[66vh] min-h-[520px]">
		<MapLibre
			center={mapCenter}
			zoom={13}
			ondragstart={onMapDragStart}
			class="h-full"
			style="https://tiles.openfreemap.org/styles/liberty"
		>
			{#if currentTrip && lineCoordinates.length >= 2}
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
						paint={{ 'line-color': '#2a4a67', 'line-width': 4, 'line-opacity': 0.95 }}
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
					<div
						class="rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-black tracking-[0.22em] text-white shadow-2xl"
					>
						START
					</div>
				</Marker>
			{/if}

			{#if currentTripEndLngLat}
				<Marker lnglat={currentTripEndLngLat}>
					<div
						class="rounded-full bg-rose-500 px-3 py-1.5 text-[10px] font-black tracking-[0.22em] text-white shadow-2xl"
					>
						FINISH
					</div>
					<Popup class="border border-white/10 bg-slate-950 text-white">
						<div class="text-xs">
							<div class="font-semibold text-white">{currentTrip?.distance_km.toFixed(1)} km</div>
							<div class="text-slate-400">{formatDuration(tripDuration)}</div>
						</div>
					</Popup>
				</Marker>
			{/if}

			{#each stopPoints as stop}
				<Marker lnglat={stop.lnglat}>
					<div
						class="rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-slate-950 shadow-2xl"
					>
						{stop.label.toUpperCase()}
					</div>
				</Marker>
			{/each}

			{#if currentPointCoordinates}
				<Marker lnglat={currentPointCoordinates}>
					<div class="relative">
						<div
							class="rounded-full bg-cyan-400 px-3 py-1.5 text-[10px] font-black tracking-[0.2em] text-slate-950 shadow-2xl"
						>
							ASSET
						</div>
						<div
							class="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-cyan-100 shadow-xl"
						>
							{formatSpeed(currentSpeed)} km/h
						</div>
					</div>
				</Marker>
			{/if}
		</MapLibre>

		<MapToolbar
			{mode}
			{followPlayback}
			{snapToRoads}
			stopCount={stopPoints.length}
			{onRecenter}
			{onToggleFollow}
			{onToggleSnap}
		/>

		<TripReplayControls
			{currentSpeed}
			{currentTime}
			{tripDuration}
			{progressPercentage}
			{seekPosition}
			{playbackSpeed}
			{isPlaying}
			{followPlayback}
			{snapToRoads}
			{onReset}
			{onPlayPause}
			{onSeek}
			{onSpeedChange}
		/>
	</div>
</section>
