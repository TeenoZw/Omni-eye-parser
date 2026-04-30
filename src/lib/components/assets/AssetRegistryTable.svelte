<script lang="ts">
	import type { FleetAsset, FleetWorkspaceData } from '$lib/types/telemetry';
	import { formatRelativeTime } from '$lib/utils/telemetry/format';

	let {
		workspace,
		selectedAssetId,
		onSelect
	}: {
		workspace: FleetWorkspaceData;
		selectedAssetId?: string | null;
		onSelect: (asset: FleetAsset) => void;
	} = $props();
</script>

<div class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
	<div class="grid grid-cols-10 gap-4 border-b border-white/8 px-4 py-3 text-[11px] tracking-[0.18em] text-slate-500 uppercase">
		<div>Asset</div>
		<div>Registration</div>
		<div>Driver</div>
		<div>Device</div>
		<div>IMEI</div>
		<div>Hub</div>
		<div>Tier</div>
		<div>Last update</div>
		<div>Status</div>
		<div>Alerts</div>
	</div>
	<div class="divide-y divide-white/6">
		{#each workspace.assets as asset}
			<button
				type="button"
				onclick={() => onSelect(asset)}
				class={`grid w-full grid-cols-10 gap-4 px-4 py-4 text-left text-sm ${
					selectedAssetId === asset.id ? 'bg-cyan-400/8' : 'hover:bg-white/[0.03]'
				}`}
			>
				<div class="font-medium text-white">{asset.name}</div>
				<div class="text-slate-300">{asset.registration}</div>
				<div class="text-slate-300">{asset.driver_name}</div>
				<div class="text-slate-300">{asset.device_id}</div>
				<div class="text-slate-300">{asset.imei}</div>
				<div class="text-slate-300">{workspace.hub.name}</div>
				<div class="text-slate-300">{asset.subscription_tier}</div>
				<div class="text-slate-300">{formatRelativeTime(asset.last_update)}</div>
				<div class="text-white capitalize">{asset.status}</div>
				<div class="text-slate-300">{asset.active_alert_count}</div>
			</button>
		{/each}
	</div>
</div>
