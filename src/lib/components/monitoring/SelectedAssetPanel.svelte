<script lang="ts">
	import type { FleetAsset } from '$lib/types/telemetry';
	import { formatDuration, formatRelativeTime } from '$lib/utils/telemetry/format';

	let { asset }: { asset: FleetAsset | null } = $props();

	const fields = $derived.by(() =>
		asset
			? [
					['Current status', asset.status],
					['Speed', `${asset.speed_kmh.toFixed(0)} km/h`],
					['Ignition', asset.ignition ? 'On' : 'Off'],
					['Last update', formatRelativeTime(asset.last_update)],
					['Location / geofence', asset.current_geofence ?? asset.location_label],
					['Today distance', `${asset.today_distance_km.toFixed(1)} km`],
					['Driving time', formatDuration(asset.today_driving_seconds)],
					['Idling time', formatDuration(asset.today_idle_seconds)],
					['Device health', asset.device_health],
					['Driver', asset.driver_name],
					['Fuel', asset.fuel_level_pct != null ? `${asset.fuel_level_pct}%` : 'Placeholder'],
					[
						'Behavior score',
						asset.driver_behavior_score != null ? `${asset.driver_behavior_score}` : 'Placeholder'
					]
				]
			: []
	);
</script>

<div class="flex h-full flex-col">
	<div class="border-b border-white/8 px-4 py-4">
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Selected asset</div>
		<div class="mt-1 text-lg font-semibold text-white">{asset?.name ?? 'No asset selected'}</div>
		<div class="mt-1 text-sm text-slate-400">{asset?.registration ?? 'Choose a unit from the map'}</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
		{#if asset}
			<div class="space-y-3">
				{#each fields as field}
					<div class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
						<div class="text-[11px] tracking-[0.16em] text-slate-500 uppercase">{field[0]}</div>
						<div class="mt-1 text-sm font-medium text-white capitalize">{field[1]}</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
				Choose an asset to inspect its current telemetry context.
			</div>
		{/if}
	</div>
</div>
