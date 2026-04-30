<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		data
	}: {
		data: { workspace: FleetWorkspaceData };
	} = $props();
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Settings"
		title="Platform settings"
		description="Hold place for hub setup, alert rules, map preferences, report preferences, and integration settings."
	/>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each [
			'Hub settings',
			'Alert rule settings',
			'Map preferences',
			'Report preferences',
			'Integration settings'
		] as item}
			<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
				<div class="text-sm font-medium text-white">{item}</div>
				<div class="mt-2 text-sm text-slate-400">
					Placeholder module for {data.workspace.hub.name} and future backend-backed controls.
				</div>
			</div>
		{/each}
	</div>
</div>
