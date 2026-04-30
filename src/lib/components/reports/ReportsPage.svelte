<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import ReportCard from '$lib/components/reports/ReportCard.svelte';
	import ReportPreviewPanel from '$lib/components/reports/ReportPreviewPanel.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();
	let selectedReportId = $state(workspace.reports[0]?.id ?? null);
	let selectedReport = $derived.by(
		() => workspace.reports.find((report) => report.id === selectedReportId) ?? workspace.reports[0] ?? null
	);
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Reports"
		title="Operational reports"
		description="Keep report generation in its own module, with ready definitions and space for future exports."
	/>

	<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
		<section class="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
			{#each workspace.reports as report}
				<button type="button" onclick={() => (selectedReportId = report.id)} class="text-left">
					<ReportCard {report} />
				</button>
			{/each}
		</section>
		<ReportPreviewPanel report={selectedReport} />
	</div>
</div>
