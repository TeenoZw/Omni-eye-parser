<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Drivers"
		title="Driver registry"
		description="Keep driver assignment, behavior score, contact, and shift context together in one operational page."
	/>

	<div class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
		<div class="grid grid-cols-6 gap-4 border-b border-white/8 px-4 py-3 text-[11px] tracking-[0.18em] text-slate-500 uppercase">
			<div>Driver</div>
			<div>Assigned asset</div>
			<div>Status</div>
			<div>Behavior</div>
			<div>Contact</div>
			<div>Shift</div>
		</div>
		<div class="divide-y divide-white/6">
			{#each workspace.drivers as driver}
				<div class="grid grid-cols-6 gap-4 px-4 py-4 text-sm">
					<div class="font-medium text-white">{driver.name}</div>
					<div class="text-slate-300">
						{driver.asset_id
							? workspace.assets.find((asset) => asset.id === driver.asset_id)?.name
							: 'Unassigned'}
					</div>
					<div class="text-slate-300 capitalize">{driver.status}</div>
					<div class="text-slate-300">{driver.score ?? 'Placeholder'}</div>
					<div class="text-slate-300">{driver.contact ?? 'Placeholder'}</div>
					<div class="text-slate-300 capitalize">{driver.shift_status?.replace('_', ' ') ?? 'Placeholder'}</div>
				</div>
			{/each}
		</div>
	</div>
</div>
