<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();

	const utilization = Math.round((workspace.summary.moving / workspace.summary.total_assets) * 100);
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Analytics"
		title="Fleet analytics"
		description="A focused management layer for utilization, idling, distance, alerts, driver behavior, and future fuel analysis."
	/>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
			<div class="text-sm text-slate-400">Utilization</div>
			<div class="mt-2 text-3xl font-semibold text-white">{utilization}%</div>
			<div class="mt-1 text-sm text-slate-500">Assets moving right now</div>
		</div>
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
			<div class="text-sm text-slate-400">Idling trend</div>
			<div class="mt-2 text-3xl font-semibold text-white">{workspace.summary.idle}</div>
			<div class="mt-1 text-sm text-slate-500">Current idle vehicles</div>
		</div>
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
			<div class="text-sm text-slate-400">Alert trend</div>
			<div class="mt-2 text-3xl font-semibold text-white">{workspace.summary.active_alerts}</div>
			<div class="mt-1 text-sm text-slate-500">Open attention items</div>
		</div>
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
			<div class="text-sm text-slate-400">Distance trend</div>
			<div class="mt-2 text-3xl font-semibold text-white">
				{workspace.summary.today_distance_estimate_km.toFixed(1)} km
			</div>
			<div class="mt-1 text-sm text-slate-500">Daily fleet estimate</div>
		</div>
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
			<div class="text-sm text-slate-400">Driver behavior</div>
			<div class="mt-2 text-3xl font-semibold text-white">
				{Math.round(
					workspace.drivers.filter((driver) => driver.score != null).reduce((sum, driver) => sum + (driver.score ?? 0), 0) /
						Math.max(1, workspace.drivers.filter((driver) => driver.score != null).length)
				)}
			</div>
			<div class="mt-1 text-sm text-slate-500">Average behavior score</div>
		</div>
		<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
			<div class="text-sm text-slate-400">Fuel analytics</div>
			<div class="mt-2 text-sm font-medium text-white">Placeholder for fleet-level fuel insights</div>
			<div class="mt-1 text-sm text-slate-500">Add once backend metrics are introduced</div>
		</div>
	</div>
</div>
