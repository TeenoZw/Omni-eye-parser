<script lang="ts">
	import type { ReportDefinition } from '$lib/types/telemetry';

	let { report }: { report: ReportDefinition } = $props();
</script>

<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
	<div class="flex items-start justify-between gap-3">
		<div>
			<div class="text-sm font-semibold text-white">{report.title}</div>
			<div class="mt-2 text-sm text-slate-400">{report.description}</div>
		</div>
		<div
			class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
				report.status === 'ready'
					? 'bg-emerald-400/10 text-emerald-300'
					: 'bg-white/8 text-slate-300'
			}`}
		>
			{report.status === 'ready' ? 'Ready' : 'Coming soon'}
		</div>
	</div>
	<div
		class="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
	>
		{report.status === 'ready' ? 'Open preview' : 'Generate placeholder'}
	</div>
</div>
