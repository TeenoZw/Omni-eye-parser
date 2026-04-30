<script lang="ts">
	import type { FleetAlert } from '$lib/types/telemetry';
	import { formatDateLabel, formatTimeLabel } from '$lib/utils/telemetry/format';

	let {
		alerts,
		selectedAlertId,
		onSelect
	}: {
		alerts: FleetAlert[];
		selectedAlertId?: string | null;
		onSelect: (alert: FleetAlert) => void;
	} = $props();

	const severityTone = {
		low: 'bg-slate-400/15 text-slate-300',
		medium: 'bg-amber-400/15 text-amber-300',
		high: 'bg-orange-400/15 text-orange-300',
		critical: 'bg-rose-400/15 text-rose-300'
	};
</script>

<div class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
	<div class="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-white/8 px-4 py-3 text-[11px] tracking-[0.18em] text-slate-500 uppercase">
		<div>Alert</div>
		<div>Asset</div>
		<div>Severity</div>
		<div>Time</div>
	</div>
	<div class="divide-y divide-white/6">
		{#each alerts as alert}
			<button
				type="button"
				onclick={() => onSelect(alert)}
				class={`grid w-full grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-4 px-4 py-4 text-left text-sm ${
					selectedAlertId === alert.id ? 'bg-cyan-400/8' : 'hover:bg-white/[0.03]'
				}`}
			>
				<div>
					<div class="font-medium text-white">{alert.title}</div>
					<div class="mt-1 text-xs text-slate-400">{alert.location_label}</div>
				</div>
				<div class="text-slate-300">{alert.asset_name}</div>
				<div>
					<span class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${severityTone[alert.severity]}`}>
						{alert.severity}
					</span>
				</div>
				<div class="text-slate-300">
					{formatDateLabel(alert.time)} {formatTimeLabel(alert.time)}
				</div>
			</button>
		{/each}
	</div>
</div>
