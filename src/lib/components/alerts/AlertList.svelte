<script lang="ts">
	import type { FleetAlert } from '$lib/types/telemetry';
	import { formatDateLabel, formatTimeLabel } from '$lib/utils/telemetry/format';

	let {
		alerts,
		selectedAlertId,
		onSelect
	}: {
		alerts: FleetAlert[];
		selectedAlertId?: string;
		onSelect: (alert: FleetAlert) => void;
	} = $props();

	const severityTone = {
		low: 'bg-slate-400/15 text-slate-300',
		medium: 'bg-amber-400/15 text-amber-300',
		high: 'bg-orange-400/15 text-orange-300',
		critical: 'bg-rose-400/15 text-rose-300'
	};
</script>

<div class="space-y-2">
	{#if alerts.length}
		{#each alerts as alert}
			<button
				type="button"
				onclick={() => onSelect(alert)}
				class={`w-full rounded-2xl border px-4 py-3 text-left transition ${
					alert.id === selectedAlertId
						? 'border-rose-400/40 bg-rose-400/10'
						: 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
				}`}
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="text-sm font-semibold text-white">{alert.title}</div>
						<div class="mt-1 text-xs text-slate-400">{alert.asset_name}</div>
					</div>
					<div
						class="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase {severityTone[
							alert.severity
						]}"
					>
						{alert.severity}
					</div>
				</div>
				<div class="mt-2 text-xs text-slate-500">
					{formatDateLabel(alert.time)}
					{formatTimeLabel(alert.time)}
				</div>
				<div class="mt-1 text-xs text-slate-400">{alert.location_label}</div>
			</button>
		{/each}
	{:else}
		<div
			class="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500"
		>
			No active alerts for the current fleet view.
		</div>
	{/if}
</div>
