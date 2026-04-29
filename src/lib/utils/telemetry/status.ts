import type {
	AssetStatus,
	FleetAlert,
	FleetSummary,
	SignalStatus,
	TelemetryPoint
} from '$lib/types/telemetry';

export function getSignalStatus(lastUpdate: string): SignalStatus {
	const ageSeconds = Math.max(0, (Date.now() - new Date(lastUpdate).getTime()) / 1000);

	if (ageSeconds <= 90) return 'fresh';
	if (ageSeconds <= 600) return 'delayed';
	if (ageSeconds <= 1800) return 'stale';
	return 'offline';
}

export function getAssetStatus(point: TelemetryPoint, lastUpdate: string): AssetStatus {
	const signal = getSignalStatus(lastUpdate);
	if (signal === 'offline') return 'offline';
	if ((point.speed_kmh ?? 0) > 3) return 'moving';
	if (point.ignition) return 'idle';
	return 'parked';
}

export function buildFleetSummary(statuses: AssetStatus[], alerts: FleetAlert[]): FleetSummary {
	return {
		total_assets: statuses.length,
		moving: statuses.filter((status) => status === 'moving').length,
		idle: statuses.filter((status) => status === 'idle').length,
		parked: statuses.filter((status) => status === 'parked').length,
		offline: statuses.filter((status) => status === 'offline').length,
		active_alerts: alerts.length
	};
}
