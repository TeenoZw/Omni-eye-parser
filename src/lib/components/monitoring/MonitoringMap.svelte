<script lang="ts">
	import { FillLayer, GeoJSONSource, LineLayer, MapLibre, Marker } from 'svelte-maplibre-gl';

	import MonitoringMapTools from '$lib/components/monitoring/MonitoringMapTools.svelte';
	import type { FleetAsset, FleetGeofence } from '$lib/types/telemetry';

	let {
		assets,
		geofences,
		selectedAsset,
		mapCenter,
		onSelectAsset,
		onRecenter
	}: {
		assets: FleetAsset[];
		geofences: FleetGeofence[];
		selectedAsset: FleetAsset | null;
		mapCenter: [number, number];
		onSelectAsset: (asset: FleetAsset) => void;
		onRecenter: () => void;
	} = $props();
</script>

<section class="relative h-[74vh] min-h-[620px] overflow-hidden rounded-[2rem] border border-white/8 bg-[#0c1728]">
	<MapLibre center={mapCenter} zoom={7.8} class="h-full" style="https://tiles.openfreemap.org/styles/liberty">
		<GeoJSONSource
			id="monitoring-geofences"
			data={{
				type: 'FeatureCollection',
				features: geofences.map((geofence) => ({
					type: 'Feature',
					properties: { name: geofence.name, type: geofence.type },
					geometry: {
						type: 'Polygon',
						coordinates: [geofence.polygon]
					}
				}))
			}}
		>
			<FillLayer
				id="monitoring-geofences-fill"
				source="monitoring-geofences"
				paint={{ 'fill-color': '#4dd6ff', 'fill-opacity': 0.08 }}
			/>
			<LineLayer
				id="monitoring-geofences-line"
				source="monitoring-geofences"
				paint={{ 'line-color': '#38bdf8', 'line-width': 2, 'line-opacity': 0.5 }}
			/>
		</GeoJSONSource>

		{#each assets as asset}
			<Marker lnglat={[asset.lon, asset.lat]}>
				<button type="button" onclick={() => onSelectAsset(asset)} class="relative">
					<div
						class={`rounded-full border px-3 py-1.5 text-[10px] font-black tracking-[0.18em] shadow-xl ${
							selectedAsset?.id === asset.id
								? 'border-cyan-200 bg-cyan-400 text-slate-950'
								: asset.status === 'offline'
									? 'border-rose-300/60 bg-rose-500 text-white'
									: 'border-white/25 bg-slate-950/90 text-white'
						}`}
					>
						{asset.registration}
					</div>
					<div class="mt-1 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] text-slate-200">
						{asset.name}
					</div>
				</button>
			</Marker>
		{/each}
	</MapLibre>

	<div class="pointer-events-none absolute left-4 top-4">
		<div class="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/82 px-4 py-3 backdrop-blur">
			<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Map workspace</div>
			<div class="mt-1 text-sm font-semibold text-white">Live tracking</div>
			<div class="mt-1 text-xs text-slate-400">
				Large map first, with geofence overlays and selected unit focus.
			</div>
		</div>
	</div>

	<MonitoringMapTools {onRecenter} />
</section>
