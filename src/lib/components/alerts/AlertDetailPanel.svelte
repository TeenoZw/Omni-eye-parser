<script lang="ts">
	import type { FleetAlert } from '$lib/types/telemetry';
	import { formatDateLabel, formatTimeLabel } from '$lib/utils/telemetry/format';

	let { alert }: { alert: FleetAlert | null } = $props();
</script>

<section class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
	<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Selected alert</div>
	<div class="mt-1 text-lg font-semibold text-white">{alert?.title ?? 'No alert selected'}</div>
	{#if alert}
		<div class="mt-4 space-y-3">
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-sm text-slate-400">Severity and status</div>
				<div class="mt-2 text-xl font-semibold text-white capitalize">
					{alert.severity} · {alert.status ?? 'open'}
				</div>
			</div>
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-300">
				<div>{alert.asset_name}</div>
				<div class="mt-1">{alert.location_label}</div>
				<div class="mt-1">{formatDateLabel(alert.time)} {formatTimeLabel(alert.time)}</div>
			</div>
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-300">
				{alert.recommended_action}
			</div>
			<div class="flex items-center gap-3">
				<button class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
					Acknowledge
				</button>
				<button class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
					Resolve
				</button>
			</div>
		</div>
	{/if}
</section>
