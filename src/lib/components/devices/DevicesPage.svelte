<script lang="ts">
	import DeviceTable from '$lib/components/devices/DeviceTable.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Devices"
		title="Tracker device registry"
		description="Track IMEIs, last packets, freshness, firmware placeholders, and health without mixing them into asset screens."
	/>
	<DeviceTable devices={workspace.devices} />
</div>
