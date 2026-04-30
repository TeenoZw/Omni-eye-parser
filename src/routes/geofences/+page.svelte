<script lang="ts">
	import GeofencesPage from '$lib/components/geofences/GeofencesPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<GeofencesPage workspace={data.workspace} />
