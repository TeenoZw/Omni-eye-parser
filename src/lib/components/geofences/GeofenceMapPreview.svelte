<script lang="ts">
	import { FillLayer, GeoJSONSource, LineLayer, MapLibre, Marker } from 'svelte-maplibre-gl';

	import type { FleetAsset, FleetGeofence } from '$lib/types/telemetry';

	let {
		geofence,
		assets
	}: {
		geofence: FleetGeofence | null;
		assets: FleetAsset[];
	} = $props();

	const visibleAssets = $derived.by(() =>
		assets.filter((asset) => geofence?.vehicles_inside.includes(asset.id))
	);
</script>

<section class="overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03]">
	<div class="h-[420px]">
		<MapLibre
			center={geofence?.center ?? [29.85, -18.9]}
			zoom={8.4}
			class="h-full"
			style="https://tiles.openfreemap.org/styles/liberty"
		>
			{#if geofence}
				<GeoJSONSource
					id="single-geofence"
					data={{
						type: 'Feature',
						properties: { name: geofence.name },
						geometry: { type: 'Polygon', coordinates: [geofence.polygon] }
					}}
				>
					<FillLayer
						id="single-geofence-fill"
						source="single-geofence"
						paint={{ 'fill-color': '#4dd6ff', 'fill-opacity': 0.12 }}
					/>
					<LineLayer
						id="single-geofence-line"
						source="single-geofence"
						paint={{ 'line-color': '#38bdf8', 'line-width': 2.5 }}
					/>
				</GeoJSONSource>
			{/if}

			{#each visibleAssets as asset}
				<Marker lnglat={[asset.lon, asset.lat]}>
					<div class="rounded-full bg-slate-950/90 px-3 py-1 text-[10px] font-semibold text-white">
						{asset.registration}
					</div>
				</Marker>
			{/each}
		</MapLibre>
	</div>
</section>
