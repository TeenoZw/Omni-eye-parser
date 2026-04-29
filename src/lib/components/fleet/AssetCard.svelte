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
		moving: 'bg-emerald-400/15 text-emerald-300',
		idle: 'bg-amber-400/15 text-amber-300',
		parked: 'bg-slate-400/15 text-slate-300',
		offline: 'bg-rose-400/15 text-rose-300'
	};
</script>

<button
	type="button"
	onclick={onSelect}
	class={`w-full rounded-2xl border px-4 py-3 text-left transition ${
		selected
			? 'border-cyan-400/50 bg-cyan-400/10'
			: 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
	}`}
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<div class="truncate text-sm font-semibold text-white">{asset.name}</div>
			<div class="mt-1 text-xs text-slate-400">{asset.registration}</div>
		</div>
		<div
			class="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase {statusTone[
				asset.status
			]}"
		>
			{asset.status}
		</div>
	</div>

	<div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
		<span>{asset.status === 'moving' ? `${asset.speed_kmh.toFixed(0)} km/h` : 'Stationary'}</span>
		<span class="text-slate-600">•</span>
		<span>Ignition {asset.ignition ? 'ON' : 'OFF'}</span>
	</div>

	<div class="mt-2 text-xs text-slate-400">Driver: {asset.driver_name}</div>
	<div class="mt-1 text-xs text-slate-400">
		Last update: {formatRelativeTime(asset.last_update)}
	</div>
	<div class="mt-1 truncate text-xs text-slate-500">{asset.location_label}</div>

	<div class="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
		<span class="rounded-full bg-white/5 px-2.5 py-1 text-slate-300">{asset.signal_status}</span>
		<span class="rounded-full bg-cyan-400/10 px-2.5 py-1 text-cyan-300"
			>{asset.subscription_tier}</span
		>
		{#if asset.active_alert_count > 0}
			<span class="rounded-full bg-rose-400/10 px-2.5 py-1 text-rose-300">
				{asset.active_alert_count} alert{asset.active_alert_count === 1 ? '' : 's'}
			</span>
		{/if}
	</div>
</button>
