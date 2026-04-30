<script lang="ts">
	import GeofenceList from '$lib/components/geofences/GeofenceList.svelte';
	import GeofenceMapPreview from '$lib/components/geofences/GeofenceMapPreview.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();
	let selectedGeofenceId = $state(workspace.geofences[0]?.id ?? null);
	let selectedGeofence = $derived.by(
		() =>
			workspace.geofences.find((geofence) => geofence.id === selectedGeofenceId) ??
			workspace.geofences[0] ??
			null
	);
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Geofences"
		title="Geofence workspace"
		description="Manage depots, customer sites, mine sites, border posts, no-go zones, and workshops from one place."
	/>

	<div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
		<section class="rounded-3xl border border-white/8 bg-white/[0.03] p-3">
			<GeofenceList
				geofences={workspace.geofences}
				{selectedGeofenceId}
				onSelect={(geofence) => (selectedGeofenceId = geofence.id)}
			/>
		</section>

		<div class="space-y-4">
			<GeofenceMapPreview geofence={selectedGeofence} assets={workspace.assets} />
			<section class="grid gap-3 md:grid-cols-3">
				<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
					<div class="text-sm text-slate-400">Vehicles inside</div>
					<div class="mt-2 text-3xl font-semibold text-white">
						{selectedGeofence?.vehicles_inside.length ?? 0}
					</div>
				</div>
				<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
					<div class="text-sm text-slate-400">Entry / exit</div>
					<div class="mt-2 text-3xl font-semibold text-white">
						{selectedGeofence?.entered_today ?? 0} / {selectedGeofence?.exited_today ?? 0}
					</div>
				</div>
				<div class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
					<div class="text-sm text-slate-400">Create / edit</div>
					<div class="mt-2 text-sm text-white">Placeholder controls for future boundary tools</div>
				</div>
			</section>
		</div>
	</div>
</div>
