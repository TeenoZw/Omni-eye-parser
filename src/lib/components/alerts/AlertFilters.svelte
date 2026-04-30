<script lang="ts">
	import type { AlertSeverity, FleetAsset } from '$lib/types/telemetry';

	let {
		severityFilter,
		statusFilter,
		assetFilter,
		assets,
		onSeverityChange,
		onStatusChange,
		onAssetChange
	}: {
		severityFilter: AlertSeverity | 'all';
		statusFilter: 'all' | 'open' | 'acknowledged' | 'resolved';
		assetFilter: string;
		assets: FleetAsset[];
		onSeverityChange: (value: AlertSeverity | 'all') => void;
		onStatusChange: (value: 'all' | 'open' | 'acknowledged' | 'resolved') => void;
		onAssetChange: (value: string) => void;
	} = $props();
</script>

<div class="grid gap-3 md:grid-cols-3">
	<select
		value={severityFilter}
		onchange={(event) => onSeverityChange((event.currentTarget as HTMLSelectElement).value as AlertSeverity | 'all')}
		class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none"
	>
		<option value="all">All severities</option>
		<option value="critical">Critical</option>
		<option value="high">High</option>
		<option value="medium">Medium</option>
		<option value="low">Low</option>
	</select>
	<select
		value={statusFilter}
		onchange={(event) =>
			onStatusChange(
				(event.currentTarget as HTMLSelectElement).value as 'all' | 'open' | 'acknowledged' | 'resolved'
			)}
		class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none"
	>
		<option value="all">All statuses</option>
		<option value="open">Open</option>
		<option value="acknowledged">Acknowledged</option>
		<option value="resolved">Resolved</option>
	</select>
	<select
		value={assetFilter}
		onchange={(event) => onAssetChange((event.currentTarget as HTMLSelectElement).value)}
		class="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none"
	>
		<option value="">All assets</option>
		{#each assets as asset}
			<option value={asset.id}>{asset.name}</option>
		{/each}
	</select>
</div>
