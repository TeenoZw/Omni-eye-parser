<script lang="ts">
	import AssetDetailDrawer from '$lib/components/assets/AssetDetailDrawer.svelte';
	import AssetRegistryTable from '$lib/components/assets/AssetRegistryTable.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();
	let selectedAssetId = $state(workspace.assets[0]?.id ?? null);
	let selectedAsset = $derived.by(
		() => workspace.assets.find((asset) => asset.id === selectedAssetId) ?? workspace.assets[0] ?? null
	);
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Assets"
		title="Fleet registry"
		description="Vehicle identity, assignment, telemetry status, and alerts all stay in one dedicated registry."
	/>

	<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
		<AssetRegistryTable {workspace} {selectedAssetId} onSelect={(asset) => (selectedAssetId = asset.id)} />
		<AssetDetailDrawer asset={selectedAsset} />
	</div>
</div>
