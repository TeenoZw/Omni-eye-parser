<script lang="ts">
	let {
		eyebrow,
		title,
		description
	}: {
		eyebrow?: string;
		title: string;
		description?: string;
	} = $props();
</script>

<div class="flex flex-col gap-1">
	{#if eyebrow}
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">{eyebrow}</div>
	{/if}
	<h1 class="text-2xl font-semibold tracking-tight text-white">{title}</h1>
	{#if description}
		<p class="max-w-3xl text-sm text-slate-400">{description}</p>
	{/if}
</div>
