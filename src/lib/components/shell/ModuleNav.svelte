<script lang="ts">
	import type { NavigationItem } from '$lib/types/telemetry';

	let {
		items,
		pathname,
		compact = false
	}: {
		items: NavigationItem[];
		pathname: string;
		compact?: boolean;
	} = $props();

	function isActive(item: NavigationItem) {
		if (item.href === '/') return pathname === '/';
		return pathname === item.href || pathname.startsWith(`${item.href}/`);
	}
</script>

{#if compact}
	<nav class="flex gap-2 overflow-x-auto pb-1">
		{#each items as item}
			<a
				href={item.href}
				class={`rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
					isActive(item)
						? 'bg-cyan-400 text-slate-950'
						: 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white'
				}`}
			>
				{item.label}
			</a>
		{/each}
	</nav>
{:else}
	<nav class="space-y-1">
		{#each items as item}
			<a
				href={item.href}
				class={`block rounded-2xl px-4 py-3 transition ${
					isActive(item)
						? 'bg-cyan-400 text-slate-950'
						: 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
				}`}
			>
				<div class="text-sm font-medium">{item.label}</div>
				<div class={`mt-1 text-xs ${isActive(item) ? 'text-slate-900/70' : 'text-slate-500'}`}>
					{item.description}
				</div>
			</a>
		{/each}
	</nav>
{/if}
