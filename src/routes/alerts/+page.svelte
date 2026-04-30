<script lang="ts">
	import AlertsPage from '$lib/components/alerts/AlertsPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<AlertsPage workspace={data.workspace} />
