<script lang="ts">
	import DeviceHealthBadge from '$lib/components/devices/DeviceHealthBadge.svelte';
	import type { FleetDevice } from '$lib/types/telemetry';
	import { formatRelativeTime } from '$lib/utils/telemetry/format';

	let { devices }: { devices: FleetDevice[] } = $props();
</script>

<div class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
	<div class="grid grid-cols-8 gap-4 border-b border-white/8 px-4 py-3 text-[11px] tracking-[0.18em] text-slate-500 uppercase">
		<div>Device ID</div>
		<div>IMEI</div>
		<div>Model</div>
		<div>Assigned asset</div>
		<div>Last packet</div>
		<div>Signal</div>
		<div>Firmware</div>
		<div>Health</div>
	</div>
	<div class="divide-y divide-white/6">
		{#each devices as device}
			<div class="grid grid-cols-8 gap-4 px-4 py-4 text-sm">
				<div class="font-medium text-white">{device.device_id}</div>
				<div class="text-slate-300">{device.imei}</div>
				<div class="text-slate-300">{device.model}</div>
				<div class="text-slate-300">{device.assigned_vehicle}</div>
				<div class="text-slate-300">{formatRelativeTime(device.last_packet)}</div>
				<div class="text-slate-300">{device.signal_status}</div>
				<div class="text-slate-300">{device.firmware_version ?? 'Placeholder'}</div>
				<div><DeviceHealthBadge status={device.health_status} /></div>
			</div>
		{/each}
	</div>
</div>
