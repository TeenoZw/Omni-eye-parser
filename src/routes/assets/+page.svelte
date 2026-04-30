<script lang="ts">
	import AssetsPage from '$lib/components/assets/AssetsPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<AssetsPage workspace={data.workspace} />
