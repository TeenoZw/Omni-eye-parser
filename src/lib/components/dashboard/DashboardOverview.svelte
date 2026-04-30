<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import FleetHealthCards from '$lib/components/dashboard/FleetHealthCards.svelte';
	import OperationalHighlights from '$lib/components/dashboard/OperationalHighlights.svelte';
	import QuickModuleLinks from '$lib/components/dashboard/QuickModuleLinks.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Dashboard"
		title="Fleet overview"
		description="A clean summary of fleet state, exceptions, and where to go next in Omni Eye."
	/>

	<FleetHealthCards summary={workspace.summary} />
	<OperationalHighlights {workspace} />
	<QuickModuleLinks />
</div>
