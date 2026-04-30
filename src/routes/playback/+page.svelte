<script lang="ts">
	import PlaybackPage from '$lib/components/playback/PlaybackPage.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<PlaybackPage workspace={data.workspace} />
