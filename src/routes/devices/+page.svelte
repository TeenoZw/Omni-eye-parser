<script lang="ts">
	import DevicesPage from '$lib/components/devices/DevicesPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<DevicesPage workspace={data.workspace} />
