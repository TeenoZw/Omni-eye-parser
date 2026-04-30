<script lang="ts">
	import type { ReportDefinition } from '$lib/types/telemetry';

	let { report }: { report: ReportDefinition | null } = $props();
</script>

<section class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
	<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Preview panel</div>
	<div class="mt-1 text-lg font-semibold text-white">{report?.title ?? 'Select a report'}</div>
	<div class="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-400">
		{#if report}
			{report.description} This module stays intentionally lean until backend-backed exports are added.
		{:else}
			Choose a report card to anchor the future preview and generation workflow.
		{/if}
	</div>
</section>
