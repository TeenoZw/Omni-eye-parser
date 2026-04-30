<script lang="ts">
	import MonitoringAssetRow from '$lib/components/monitoring/MonitoringAssetRow.svelte';
	import type { AssetStatus, FleetAsset } from '$lib/types/telemetry';

	let {
		assets,
		selectedAssetId,
		searchValue,
		statusFilter,
		onSearchChange,
		onStatusFilterChange,
		onSelectAsset
	}: {
		assets: FleetAsset[];
		selectedAssetId?: string | null;
		searchValue: string;
		statusFilter: AssetStatus | 'all';
		onSearchChange: (value: string) => void;
		onStatusFilterChange: (value: AssetStatus | 'all') => void;
		onSelectAsset: (asset: FleetAsset) => void;
	} = $props();

	const filters: Array<AssetStatus | 'all'> = ['all', 'moving', 'idle', 'parked', 'offline'];
</script>

<div class="flex h-full flex-col">
	<div class="border-b border-white/8 px-4 py-4">
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Monitoring list</div>
		<div class="mt-1 text-lg font-semibold text-white">Fleet units</div>
		<div class="mt-3 space-y-3">
			<input
				value={searchValue}
				oninput={(event) => onSearchChange((event.currentTarget as HTMLInputElement).value)}
				placeholder="Search asset, reg, driver"
				class="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
			/>
			<div class="flex flex-wrap gap-2">
				{#each filters as filter}
					<button
						type="button"
						onclick={() => onStatusFilterChange(filter)}
						class={`rounded-full px-3 py-1.5 text-xs ${
							statusFilter === filter
								? 'bg-cyan-400 text-slate-950'
								: 'bg-white/5 text-slate-300'
						}`}
					>
						{filter}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
		{#each assets as asset}
			<MonitoringAssetRow
				asset={asset}
				selected={asset.id === selectedAssetId}
				onSelect={() => onSelectAsset(asset)}
			/>
		{/each}
	</div>
</div>
