<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import MonitoringAssetPanel from '$lib/components/monitoring/MonitoringAssetPanel.svelte';
	import MonitoringMap from '$lib/components/monitoring/MonitoringMap.svelte';
	import SelectedAssetPanel from '$lib/components/monitoring/SelectedAssetPanel.svelte';
	import type { AssetStatus, FleetAsset, FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();

	let searchValue = $state('');
	let statusFilter = $state<AssetStatus | 'all'>('all');
	let selectedAssetId = $state(workspace.assets[0]?.id ?? null);
	let selectedAsset = $derived.by(
		() => workspace.assets.find((asset) => asset.id === selectedAssetId) ?? workspace.assets[0] ?? null
	);
	let filteredAssets = $derived.by(() => {
		const query = searchValue.trim().toLowerCase();
		return workspace.assets.filter((asset) => {
			const matchesFilter = statusFilter === 'all' || asset.status === statusFilter;
			const matchesQuery =
				!query ||
				[asset.name, asset.registration, asset.driver_name, asset.location_label, asset.imei]
					.filter(Boolean)
					.some((value) => value.toLowerCase().includes(query));
			return matchesFilter && matchesQuery;
		});
	});
	let mapCenter = $state<[number, number]>([29.85, -18.9]);

	$effect(() => {
		if (selectedAsset) {
			mapCenter = [selectedAsset.lon, selectedAsset.lat];
		}
	});

	function selectAsset(asset: FleetAsset) {
		selectedAssetId = asset.id;
	}

	function recenterMap() {
		if (selectedAsset) {
			mapCenter = [selectedAsset.lon, selectedAsset.lat];
		}
	}
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Monitoring"
		title="Live fleet monitoring"
		description="Track units from a map-first workspace with a focused list on the left and a selected asset context panel on the right."
	/>

	<div class="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_320px]">
		<section class="overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03]">
			<MonitoringAssetPanel
				assets={filteredAssets}
				selectedAssetId={selectedAsset?.id}
				{searchValue}
				{statusFilter}
				onSearchChange={(value) => (searchValue = value)}
				onStatusFilterChange={(value) => (statusFilter = value)}
				onSelectAsset={selectAsset}
			/>
		</section>

		<MonitoringMap
			assets={filteredAssets.length ? filteredAssets : workspace.assets}
			geofences={workspace.geofences}
			{selectedAsset}
			{mapCenter}
			onSelectAsset={selectAsset}
			onRecenter={recenterMap}
		/>

		<section class="overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03]">
			<SelectedAssetPanel asset={selectedAsset} />
		</section>
	</div>
</div>
