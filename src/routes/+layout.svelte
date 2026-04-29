<script>
	import '../app.css';
	import 'maplibre-gl/dist/maplibre-gl.css';

	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Omni Eye - Fleet Telemetry Workspace</title>
	<meta
		name="description"
		content="Fleet telemetry workspace for live visibility, trip playback, alerts, and operational context"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="min-h-screen bg-[#06101b]">
	{@render children?.()}
</div>
