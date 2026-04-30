<script lang="ts">
	let {
		onRecenter
	}: {
		onRecenter: () => void;
	} = $props();

	const tools = ['Search', 'Layers', 'Geofences', 'Routing', 'Measure'];
</script>

<div class="pointer-events-none absolute right-4 top-4 flex flex-col gap-2">
	{#each tools as tool}
		<div
			class="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/84 px-3 py-2 text-xs text-slate-300 backdrop-blur"
		>
			{tool}
		</div>
	{/each}
	<button
		type="button"
		onclick={onRecenter}
		class="pointer-events-auto rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 backdrop-blur"
	>
		Recenter
	</button>
</div>
