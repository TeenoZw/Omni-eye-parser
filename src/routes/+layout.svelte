<script>
	import '../app.css';
	import 'maplibre-gl/dist/maplibre-gl.css';

	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Omni Eye v2.0 - Advanced GPS Trip Playback</title>
	<meta
		name="description"
		content="Modern GPS trip playback interface with real-time animation, speedometer, and advanced filtering"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
	{@render children?.()}
</div>
