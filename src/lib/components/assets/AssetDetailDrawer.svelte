<script lang="ts">
	import type { FleetAsset } from '$lib/types/telemetry';

	let { asset }: { asset: FleetAsset | null } = $props();
</script>

<section class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
	<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Asset details</div>
	<div class="mt-1 text-lg font-semibold text-white">{asset?.name ?? 'Select an asset'}</div>
	{#if asset}
		<div class="mt-4 space-y-3 text-sm">
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-slate-300">
				{asset.registration} · {asset.driver_name}
			</div>
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-slate-300">
				Assigned device {asset.device_id} · IMEI {asset.imei}
			</div>
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-slate-300">
				{asset.location_label} · {asset.current_geofence ?? 'No geofence context'}
			</div>
		</div>
	{/if}
</section>
