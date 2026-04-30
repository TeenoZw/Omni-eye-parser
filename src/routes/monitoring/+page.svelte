<script lang="ts">
	import MonitoringPage from '$lib/components/monitoring/MonitoringPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<MonitoringPage workspace={data.workspace} />
