<script lang="ts">
	import PlaybackWorkspace from '$lib/components/playback/PlaybackWorkspace.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();
</script>

<PlaybackWorkspace {workspace} />
