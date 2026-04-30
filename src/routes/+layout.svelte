<script lang="ts">
	import '../app.css';
	import 'maplibre-gl/dist/maplibre-gl.css';

	import { page } from '$app/state';
	import PlatformShell from '$lib/components/shell/PlatformShell.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		children,
		data
	}: {
		children: import('svelte').Snippet;
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Omni Eye - Fleet Platform</title>
	<meta
		name="description"
		content="Omni Eye fleet platform shell for live tracking, playback, assets, alerts, reports, and analytics"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<PlatformShell workspace={data.workspace} summary={data.workspace.summary} pathname={page.url.pathname}>
	{@render children?.()}
</PlatformShell>
