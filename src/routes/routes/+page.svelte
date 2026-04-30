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
		eyebrow="Routes"
		title="Route planning"
		description="A dedicated placeholder for planned routes, saved route templates, compliance monitoring, and future geofence integration."
	/>

	<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
		<section class="space-y-3">
			{#each data.workspace.routes as route}
				<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="text-sm font-semibold text-white">{route.name}</div>
							<div class="mt-1 text-sm text-slate-400">{route.origin} to {route.destination}</div>
						</div>
						<div class="rounded-full bg-white/6 px-3 py-1 text-xs text-slate-300 uppercase">
							{route.status}
						</div>
					</div>
					<div class="mt-3 text-sm text-slate-400">{route.compliance_note}</div>
				</div>
			{/each}
		</section>

		<section class="space-y-3">
			<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
				<div class="text-sm font-semibold text-white">Route planning placeholder</div>
				<div class="mt-2 text-sm text-slate-400">
					Future planners will sit here with geofence-aware start and finish points.
				</div>
			</div>
			<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
				<div class="text-sm font-semibold text-white">Saved routes placeholder</div>
				<div class="mt-2 text-sm text-slate-400">
					Templates and dispatch-ready route collections will be linked here.
				</div>
			</div>
		</section>
	</div>
</div>
