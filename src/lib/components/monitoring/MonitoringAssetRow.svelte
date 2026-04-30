<script lang="ts">
	import type { FleetAsset } from '$lib/types/telemetry';
	import { formatRelativeTime } from '$lib/utils/telemetry/format';

	let {
		asset,
		selected = false,
		onSelect
	}: {
		asset: FleetAsset;
		selected?: boolean;
		onSelect: () => void;
	} = $props();

	const statusTone = {
		moving: 'bg-emerald-400',
		idle: 'bg-amber-400',
		parked: 'bg-slate-400',
		offline: 'bg-rose-400'
	};
</script>

<button
	type="button"
	onclick={onSelect}
	class={`w-full rounded-2xl border px-3 py-3 text-left transition ${
		selected
			? 'border-cyan-400/40 bg-cyan-400/10'
			: 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
	}`}
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<div class={`h-2.5 w-2.5 rounded-full ${statusTone[asset.status]}`}></div>
				<div class="truncate text-sm font-semibold text-white">{asset.name}</div>
			</div>
			<div class="mt-1 text-xs text-slate-400">
				{asset.registration} · {asset.driver_name || asset.location_label}
			</div>
			<div class="mt-1 text-xs text-slate-500">{asset.location_label}</div>
		</div>
		<div class="text-right">
			<div class="text-sm font-semibold text-white">{asset.speed_kmh.toFixed(0)} km/h</div>
			<div class="mt-1 text-[11px] text-slate-500">{formatRelativeTime(asset.last_update)}</div>
		</div>
	</div>

	<div class="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
		<div class="rounded-full bg-white/5 px-2 py-1 text-slate-300 uppercase">{asset.status}</div>
		<div class="rounded-full bg-white/5 px-2 py-1 text-slate-300">
			Ignition {asset.ignition ? 'On' : 'Off'}
		</div>
		<div class="rounded-full bg-white/5 px-2 py-1 text-slate-300">{asset.signal_status}</div>
		<div class="rounded-full bg-white/5 px-2 py-1 text-slate-300">
			Alerts {asset.active_alert_count}
		</div>
	</div>
</button>
