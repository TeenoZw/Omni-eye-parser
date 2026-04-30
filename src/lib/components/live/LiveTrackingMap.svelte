<script lang="ts">
	import AssetList from '$lib/components/fleet/AssetList.svelte';
	import { MapLibre, Marker } from 'svelte-maplibre-gl';

	import type { FleetAsset } from '$lib/types/telemetry';
	import { formatDuration, formatRelativeTime } from '$lib/utils/telemetry/format';

	let {
		assets,
		selectedAsset,
		mapCenter,
		onSelectAsset
	}: {
		assets: FleetAsset[];
		selectedAsset: FleetAsset | null;
		mapCenter: [number, number];
		onSelectAsset: (asset: FleetAsset) => void;
	} = $props();
</script>

<section class="overflow-hidden rounded-3xl border border-white/8 bg-[#0c1728]">
	<div class="border-b border-white/8 px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<div>
				<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Live map</div>
				<div class="mt-1 text-lg font-semibold text-white">Current fleet position</div>
			</div>
			<div class="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
				{assets.length} tracked assets
			</div>
		</div>
	</div>

	<div class="relative h-[74vh] min-h-[620px]">
		<MapLibre
			center={mapCenter}
			zoom={8.6}
			class="h-full"
			style="https://tiles.openfreemap.org/styles/liberty"
		>
			{#each assets as asset}
				<Marker lnglat={[asset.lon, asset.lat]}>
					<button type="button" onclick={() => onSelectAsset(asset)} class="relative">
						<div
							class={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[0.18em] shadow-xl ${
								selectedAsset?.id === asset.id
									? 'border-cyan-200 bg-cyan-400 text-slate-950'
									: asset.status === 'offline'
										? 'border-rose-300/60 bg-rose-500 text-white'
										: 'border-white/25 bg-slate-950/90 text-white'
							}`}
						>
							{asset.registration}
						</div>
						{#if selectedAsset?.id === asset.id}
							<div
								class="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-cyan-100"
							>
								{asset.speed_kmh.toFixed(0)} km/h
							</div>
						{/if}
					</button>
				</Marker>
			{/each}
		</MapLibre>

		<div class="pointer-events-none absolute inset-x-4 top-4 flex justify-between gap-4">
			<div
				class="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/82 px-4 py-3 backdrop-blur"
			>
				<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Selected asset</div>
				<div class="mt-1 text-sm font-semibold text-white">
					{selectedAsset?.name ?? 'None selected'}
				</div>
				<div class="mt-1 text-xs text-slate-400">
					{selectedAsset?.location_label ?? 'Choose an asset from the list'}
				</div>
			</div>
			<div
				class="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/82 px-4 py-3 text-xs text-slate-300 backdrop-blur"
			>
				<div>Moving: {assets.filter((asset) => asset.status === 'moving').length}</div>
				<div class="mt-1">
					Offline: {assets.filter((asset) => asset.status === 'offline').length}
				</div>
			</div>
		</div>

		<div class="pointer-events-none absolute inset-y-4 left-4 hidden w-[320px] xl:block">
			<div
				class="pointer-events-auto flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/82 backdrop-blur"
			>
				<div class="border-b border-white/8 px-4 py-3">
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Fleet list</div>
					<div class="mt-1 text-sm text-slate-300">
						Assets stay available without leaving the map.
					</div>
				</div>
				<div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
					<AssetList
						{assets}
						selectedAssetId={selectedAsset?.id ?? undefined}
						onSelect={onSelectAsset}
					/>
				</div>
			</div>
		</div>

		<div class="pointer-events-none absolute inset-y-4 right-4 hidden w-[320px] xl:block">
			<div
				class="pointer-events-auto flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/82 backdrop-blur"
			>
				<div class="border-b border-white/8 px-4 py-3">
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Asset detail</div>
					<div class="mt-1 text-lg font-semibold text-white">
						{selectedAsset?.name ?? 'No asset selected'}
					</div>
					<div class="mt-1 text-sm text-slate-400">
						{selectedAsset?.registration ?? 'Choose an asset from the list'}
					</div>
				</div>

				{#if selectedAsset}
					<div class="space-y-4 overflow-y-auto px-4 py-4">
						<div class="grid grid-cols-2 gap-3">
							<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
								<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Status</div>
								<div class="mt-2 text-2xl font-semibold text-white capitalize">
									{selectedAsset.status}
								</div>
								<div class="text-sm text-slate-400">{selectedAsset.speed_kmh.toFixed(0)} km/h</div>
							</div>
							<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
								<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
									Last update
								</div>
								<div class="mt-2 text-2xl font-semibold text-white">
									{formatRelativeTime(selectedAsset.last_update)}
								</div>
								<div class="text-sm text-slate-400">{selectedAsset.signal_status}</div>
							</div>
						</div>

						<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Today</div>
							<div class="mt-4 space-y-3 text-sm">
								<div class="flex items-center justify-between border-b border-white/6 pb-3">
									<span class="text-slate-400">Distance</span>
									<span class="text-white">{selectedAsset.today_distance_km.toFixed(1)} km</span>
								</div>
								<div class="flex items-center justify-between border-b border-white/6 pb-3">
									<span class="text-slate-400">Driving time</span>
									<span class="text-white"
										>{formatDuration(selectedAsset.today_driving_seconds)}</span
									>
								</div>
								<div class="flex items-center justify-between border-b border-white/6 pb-3">
									<span class="text-slate-400">Idle / parked</span>
									<span class="text-white">{formatDuration(selectedAsset.today_idle_seconds)}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-slate-400">Max speed</span>
									<span class="text-white">{selectedAsset.max_speed_today_kmh.toFixed(0)} km/h</span
									>
								</div>
							</div>
						</div>

						<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
							<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Context</div>
							<div class="mt-4 space-y-3 text-sm">
								<div class="flex items-center justify-between border-b border-white/6 pb-3">
									<span class="text-slate-400">Driver</span>
									<span class="text-white">{selectedAsset.driver_name}</span>
								</div>
								<div class="flex items-center justify-between border-b border-white/6 pb-3">
									<span class="text-slate-400">Ignition</span>
									<span class="text-white">{selectedAsset.ignition ? 'ON' : 'OFF'}</span>
								</div>
								<div class="flex items-center justify-between border-b border-white/6 pb-3">
									<span class="text-slate-400">Device health</span>
									<span class="text-white">{selectedAsset.device_health}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-slate-400">Current geofence</span>
									<span class="text-white">{selectedAsset.current_geofence ?? 'Unknown'}</span>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>
