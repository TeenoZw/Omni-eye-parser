<script lang="ts">
	import AnalyticsPage from '$lib/components/analytics/AnalyticsPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<AnalyticsPage workspace={data.workspace} />
