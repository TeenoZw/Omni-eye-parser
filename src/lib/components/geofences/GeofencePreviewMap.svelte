<script lang="ts">
	import { FillLayer, GeoJSONSource, MapLibre, Marker } from 'svelte-maplibre-gl';

	import type { FleetAsset, FleetGeofence } from '$lib/types/telemetry';

	let {
		geofence,
		assets
	}: {
		geofence: FleetGeofence | null;
		assets: FleetAsset[];
	} = $props();

	let vehiclesInside = $derived.by(() =>
		assets.filter((asset) => geofence?.vehicles_inside.includes(asset.id))
	);
</script>

<section class="overflow-hidden rounded-3xl border border-white/8 bg-[#0c1728]">
	<div class="border-b border-white/8 px-4 py-3">
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Geofence preview</div>
		<div class="mt-1 text-lg font-semibold text-white">{geofence?.name ?? 'Select a geofence'}</div>
	</div>

	<div class="relative h-[52vh] min-h-[420px]">
		{#if geofence}
			<MapLibre
				center={geofence.center}
				zoom={11.8}
				class="h-full"
				style="https://tiles.openfreemap.org/styles/liberty"
			>
				<GeoJSONSource
					id="geofence-source"
					data={{
						type: 'Feature',
						properties: {},
						geometry: { type: 'Polygon', coordinates: [geofence.polygon] }
					}}
				>
					<FillLayer
						id="geofence-fill"
						source="geofence-source"
						paint={{ 'fill-color': '#43d4ff', 'fill-opacity': 0.18 }}
					/>
				</GeoJSONSource>

				{#each vehiclesInside as asset}
					<Marker lnglat={[asset.lon, asset.lat]}>
						<div
							class="rounded-full bg-cyan-400 px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-slate-950 shadow-xl"
						>
							{asset.registration}
						</div>
					</Marker>
				{/each}
			</MapLibre>
		{:else}
			<div class="flex h-full items-center justify-center text-sm text-slate-500">
				Choose a geofence to preview it on the map.
			</div>
		{/if}
	</div>
</section>
