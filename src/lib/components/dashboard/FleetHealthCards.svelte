<script lang="ts">
	import type { DashboardSummary } from '$lib/types/telemetry';

	let { summary }: { summary: DashboardSummary } = $props();

	const cards = [
		{ label: 'Total assets', value: () => summary.total_assets, note: 'Tracked in current hub' },
		{ label: 'Moving', value: () => summary.moving, note: 'Units actively in motion' },
		{ label: 'Idle', value: () => summary.idle, note: 'Ignition on, waiting' },
		{ label: 'Parked', value: () => summary.parked, note: 'Stopped and settled' },
		{ label: 'Offline', value: () => summary.offline, note: 'Outside freshness window' },
		{ label: 'Active alerts', value: () => summary.active_alerts, note: 'Needs operator review' }
	];
</script>

<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
	{#each cards as card}
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
			<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">{card.label}</div>
			<div class="mt-2 text-3xl font-semibold text-white">{card.value()}</div>
			<div class="mt-1 text-sm text-slate-400">{card.note}</div>
		</div>
	{/each}
</div>
