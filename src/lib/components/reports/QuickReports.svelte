<script lang="ts">
	import type { QuickReportItem } from '$lib/types/telemetry';

	let { reports }: { reports: QuickReportItem[] } = $props();
</script>

<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
	<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Reports</div>
	<div class="mt-1 text-base font-semibold text-white">Quick access</div>
	<div class="mt-4 space-y-3">
		{#each reports as report}
			<div class="rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3">
				<div class="flex items-center justify-between gap-3">
					<div class="text-sm font-medium text-white">{report.title}</div>
					<div
						class={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase ${
							report.status === 'ready'
								? 'bg-emerald-400/15 text-emerald-300'
								: 'bg-white/8 text-slate-300'
						}`}
					>
						{report.status === 'ready' ? 'Ready' : 'Soon'}
					</div>
				</div>
				<div class="mt-1 text-xs text-slate-400">{report.description}</div>
			</div>
		{/each}
	</div>
</div>
