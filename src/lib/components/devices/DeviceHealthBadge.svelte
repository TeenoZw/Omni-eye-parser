<script lang="ts">
	let { status }: { status: string } = $props();

	const tone =
		status.toLowerCase().includes('healthy')
			? 'bg-emerald-400/10 text-emerald-300'
			: status.toLowerCase().includes('offline')
				? 'bg-rose-400/10 text-rose-300'
				: 'bg-amber-400/10 text-amber-300';
</script>

<span class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${tone}`}>{status}</span>
