<script lang="ts">
	import type { FleetGeofence } from '$lib/types/telemetry';

	let {
		geofences,
		selectedGeofenceId,
		onSelect
	}: {
		geofences: FleetGeofence[];
		selectedGeofenceId?: string | null;
		onSelect: (geofence: FleetGeofence) => void;
	} = $props();
</script>

<div class="space-y-2">
	{#each geofences as geofence}
		<button
			type="button"
			onclick={() => onSelect(geofence)}
			class={`w-full rounded-2xl border px-4 py-3 text-left ${
				selectedGeofenceId === geofence.id
					? 'border-cyan-400/40 bg-cyan-400/10'
					: 'border-white/8 bg-white/[0.02]'
			}`}
		>
			<div class="text-sm font-medium text-white">{geofence.name}</div>
			<div class="mt-1 text-xs text-slate-400">
				{geofence.type.replaceAll('_', ' ')} · {geofence.vehicles_inside.length} vehicles inside
			</div>
		</button>
	{/each}
</div>
