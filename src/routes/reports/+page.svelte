<script lang="ts">
	import ReportsPage from '$lib/components/reports/ReportsPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<ReportsPage workspace={data.workspace} />
