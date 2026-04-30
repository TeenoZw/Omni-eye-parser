<script lang="ts">
	import AlertDetailPanel from '$lib/components/alerts/AlertDetailPanel.svelte';
	import AlertFilters from '$lib/components/alerts/AlertFilters.svelte';
	import AlertsTable from '$lib/components/alerts/AlertsTable.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { AlertSeverity, FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();

	let severityFilter = $state<AlertSeverity | 'all'>('all');
	let statusFilter = $state<'all' | 'open' | 'acknowledged' | 'resolved'>('all');
	let assetFilter = $state('');
	let selectedAlertId = $state(workspace.alerts[0]?.id ?? null);
	let filteredAlerts = $derived.by(() =>
		workspace.alerts.filter((alert) => {
			const severityMatches = severityFilter === 'all' || alert.severity === severityFilter;
			const statusMatches = statusFilter === 'all' || (alert.status ?? 'open') === statusFilter;
			const assetMatches = !assetFilter || alert.asset_id === assetFilter;
			return severityMatches && statusMatches && assetMatches;
		})
	);
	let selectedAlert = $derived.by(
		() => filteredAlerts.find((alert) => alert.id === selectedAlertId) ?? filteredAlerts[0] ?? null
	);
</script>

<div class="space-y-4">
	<PageHeader
		eyebrow="Alerts"
		title="Operational attention queue"
		description="Triage alerts in their own module instead of mixing them into the map or dashboard."
	/>

	<AlertFilters
		{severityFilter}
		{statusFilter}
		{assetFilter}
		assets={workspace.assets}
		onSeverityChange={(value) => (severityFilter = value)}
		onStatusChange={(value) => (statusFilter = value)}
		onAssetChange={(value) => (assetFilter = value)}
	/>

	<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
		<AlertsTable alerts={filteredAlerts} {selectedAlertId} onSelect={(alert) => (selectedAlertId = alert.id)} />
		<AlertDetailPanel alert={selectedAlert} />
	</div>
</div>
