<script lang="ts">
	import DriversPage from '$lib/components/drivers/DriversPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<DriversPage workspace={data.workspace} />
