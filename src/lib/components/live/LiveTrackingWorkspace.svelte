<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import LiveTrackingMap from '$lib/components/live/LiveTrackingMap.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';
	import { reverseCoords } from '$lib/utils/trips/playback';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();

	let selectedAssetId = $state(workspace.assets[0]?.id ?? null);
	let selectedAsset = $derived.by(
		() =>
			workspace.assets.find((asset) => asset.id === selectedAssetId) ?? workspace.assets[0] ?? null
	);
	let mapCenter = $state<[number, number]>([29.84893, -18.8983116]);

	$effect(() => {
		const center = reverseCoords(selectedAsset?.lat, selectedAsset?.lon);
		if (center) mapCenter = center;
	});

	function selectAsset(asset: FleetWorkspaceData['assets'][number]) {
		selectedAssetId = asset.id;
	}
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Live Tracking"
		title="Live fleet operations"
		description="Monitor current vehicle position, status, ignition, and device freshness from one map-first workspace."
	/>

	<LiveTrackingMap
		assets={workspace.assets}
		{selectedAsset}
		{mapCenter}
		onSelectAsset={selectAsset}
	/>
</div>
