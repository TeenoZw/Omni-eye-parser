<script lang="ts">
	import AssetCard from '$lib/components/fleet/AssetCard.svelte';
	import type { FleetAsset } from '$lib/types/telemetry';

	let {
		assets,
		selectedAssetId,
		onSelect
	}: {
		assets: FleetAsset[];
		selectedAssetId?: string;
		onSelect: (asset: FleetAsset) => void;
	} = $props();
</script>

<div class="space-y-2">
	{#if assets.length}
		{#each assets as asset}
			<AssetCard {asset} selected={asset.id === selectedAssetId} onSelect={() => onSelect(asset)} />
		{/each}
	{:else}
		<div
			class="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500"
		>
			No assets are available for this fleet scope.
		</div>
	{/if}
</div>
