import rawData from '../../routes/data.json';

import type {
	DashboardSummary,
	FleetAlert,
	FleetApiResult,
	FleetAsset,
	FleetDevice,
	FleetDriver,
	FleetGeofence,
	FleetWorkspaceData,
	ReportDefinition,
	RouteSummary,
	TelemetryPoint,
	TripSummary
} from '$lib/types/telemetry';
import { buildFleetSummary, getAssetStatus, getSignalStatus } from '$lib/utils/telemetry/status';

function shiftPoint(
	point: TelemetryPoint,
	latShift: number,
	lonShift: number,
	speedFactor = 1
): TelemetryPoint {
	return {
		...point,
		lat: Number((point.lat + latShift).toFixed(6)),
		lon: Number((point.lon + lonShift).toFixed(6)),
		speed_kmh: Number((point.speed_kmh * speedFactor).toFixed(1))
	};
}

function shiftTrip(
	trip: (typeof rawData.trips)[number],
	index: number,
	assetId: string,
	latShift: number,
	lonShift: number,
	speedFactor = 1
): TripSummary {
	const points = trip.points.map((point) => shiftPoint(point, latShift, lonShift, speedFactor));
	const firstPoint = points[0];
	const lastPoint = points[points.length - 1];

	return {
		id: `${assetId}_trip_${index + 1}`,
		asset_id: assetId,
		name: `Trip ${index + 1}`,
		start_time: trip.start_time,
		end_time: trip.end_time,
		start_lat: firstPoint.lat,
		start_lon: firstPoint.lon,
		end_lat: lastPoint.lat,
		end_lon: lastPoint.lon,
		moving_seconds: trip.moving_seconds,
		stopped_seconds: trip.stopped_seconds,
		distance_km: trip.distance_km,
		max_speed_kmh: Number((trip.max_speed_kmh * speedFactor).toFixed(1)),
		avg_moving_speed_kmh: Number((trip.avg_moving_speed_kmh * speedFactor).toFixed(1)),
		start_label: 'Depot',
		end_label: trip.distance_km > 0 ? 'Route endpoint' : 'Standby position',
		status: trip.distance_km > 0 && points.length > 1 ? 'replayable' : 'ready',
		points,
		stop_count: 0,
		overspeed_event_count: trip.max_speed_kmh * speedFactor > 80 ? 1 : 0,
		algorithm_version: rawData.algo_version
	};
}

function lastReplayableTrip(trips: TripSummary[]) {
	return (
		[...trips].reverse().find((trip) => trip.status === 'replayable') ?? trips[trips.length - 1]
	);
}

function buildAsset(config: {
	id: string;
	vehicle_id: string;
	device_id: string;
	imei: string;
	name: string;
	registration: string;
	driver_name: string;
	subscription_tier: string;
	location_label: string;
	current_geofence: string;
	device_health: string;
	latShift: number;
	lonShift: number;
	speedFactor?: number;
	tripSlice?: [number, number];
	overrideLastUpdate?: string;
	overrideIgnition?: boolean;
	overrideSpeed?: number;
}): FleetAsset {
	const sourceTrips = config.tripSlice
		? rawData.trips.slice(config.tripSlice[0], config.tripSlice[1])
		: rawData.trips;
	const trips = sourceTrips.map((trip, index) =>
		shiftTrip(trip, index, config.id, config.latShift, config.lonShift, config.speedFactor ?? 1)
	);

	const anchorTrip = lastReplayableTrip(trips);
	const latestPoint = anchorTrip?.points?.[anchorTrip.points.length - 1];
	const lastUpdate = config.overrideLastUpdate ?? rawData.end_ts;
	const pointForStatus = {
		...latestPoint,
		speed_kmh: config.overrideSpeed ?? latestPoint?.speed_kmh ?? 0,
		ignition: config.overrideIgnition ?? (config.overrideSpeed ?? latestPoint?.speed_kmh ?? 0) > 0.5
	};
	const status = getAssetStatus(pointForStatus, lastUpdate);
	const speedKmh = config.overrideSpeed ?? latestPoint?.speed_kmh ?? 0;

	return {
		id: config.id,
		asset_id: config.id,
		vehicle_id: config.vehicle_id,
		device_id: config.device_id,
		hub_id: 'hub_001',
		tenant_id: 'tenant_001',
		imei: config.imei,
		name: config.name,
		registration: config.registration,
		driver_name: config.driver_name,
		status,
		ignition: pointForStatus.ignition ?? false,
		speed_kmh: Number(speedKmh.toFixed(1)),
		last_update: lastUpdate,
		location_label: config.location_label,
		lat: latestPoint?.lat ?? 0,
		lon: latestPoint?.lon ?? 0,
		signal_status: getSignalStatus(lastUpdate),
		subscription_tier: config.subscription_tier,
		active_alert_count: 0,
		current_geofence: config.current_geofence,
		today_distance_km: Number(
			trips.reduce((sum, trip) => sum + (trip.distance_km || 0), 0).toFixed(1)
		),
		today_driving_seconds: trips.reduce((sum, trip) => sum + (trip.moving_seconds || 0), 0),
		today_idle_seconds: trips.reduce((sum, trip) => sum + (trip.stopped_seconds || 0), 0),
		max_speed_today_kmh: Math.max(...trips.map((trip) => trip.max_speed_kmh), 0),
		fuel_level_pct: config.id === 'asset_001' ? 68 : config.id === 'asset_002' ? 54 : undefined,
		driver_behavior_score:
			config.id === 'asset_001' ? 91 : config.id === 'asset_002' ? 83 : undefined,
		device_health: config.device_health,
		trips
	};
}

function buildWorkspaceData(): FleetWorkspaceData {
	const assets: FleetAsset[] = [
		buildAsset({
			id: 'asset_001',
			vehicle_id: 'veh_001',
			device_id: 'dev_001',
			imei: rawData.device_imei,
			name: 'Toyota Hilux',
			registration: 'ACF 1234',
			driver_name: 'T. Moyo',
			subscription_tier: 'Pro',
			location_label: 'Near Kwekwe CBD',
			current_geofence: 'Kwekwe Depot',
			device_health: 'Healthy',
			latShift: 0,
			lonShift: 0,
			speedFactor: 1
		}),
		buildAsset({
			id: 'asset_002',
			vehicle_id: 'veh_002',
			device_id: 'dev_002',
			imei: '352592577368476',
			name: 'Volvo FMX',
			registration: 'AGM 2841',
			driver_name: 'R. Dube',
			subscription_tier: 'Pro',
			location_label: 'Approaching Gweru Road',
			current_geofence: 'Mvuma Mine Site',
			device_health: 'Healthy',
			latShift: -0.062,
			lonShift: 0.081,
			speedFactor: 0.82,
			tripSlice: [5, rawData.trips.length]
		}),
		buildAsset({
			id: 'asset_003',
			vehicle_id: 'veh_003',
			device_id: 'dev_003',
			imei: '352592577368477',
			name: 'Scania R500',
			registration: 'AFR 9920',
			driver_name: 'K. Sibanda',
			subscription_tier: 'Standard',
			location_label: 'Parked at Redcliff Workshop',
			current_geofence: 'Redcliff Workshop',
			device_health: 'Battery warning',
			latShift: 0.044,
			lonShift: -0.071,
			speedFactor: 0.58,
			tripSlice: [0, Math.max(6, Math.floor(rawData.trips.length * 0.45))],
			overrideIgnition: false,
			overrideSpeed: 0
		}),
		buildAsset({
			id: 'asset_004',
			vehicle_id: 'veh_004',
			device_id: 'dev_004',
			imei: '352592577368478',
			name: 'Isuzu NPR',
			registration: 'AHH 7782',
			driver_name: 'L. Ncube',
			subscription_tier: 'Starter',
			location_label: 'Offline near Beitbridge Border Post',
			current_geofence: 'Beitbridge Border Post',
			device_health: 'Tracker offline',
			latShift: -0.089,
			lonShift: -0.114,
			speedFactor: 0.4,
			tripSlice: [0, Math.max(4, Math.floor(rawData.trips.length * 0.35))],
			overrideIgnition: false,
			overrideSpeed: 0,
			overrideLastUpdate: '2025-07-03T07:12:00Z'
		})
	];

	const alerts: FleetAlert[] = [
		{
			id: 'alert_001',
			type: 'Overspeed',
			title: 'Overspeed on A5 corridor',
			asset_id: 'asset_001',
			asset_name: 'Toyota Hilux',
			time: rawData.end_ts,
			severity: 'high',
			location_label: 'Near Kwekwe CBD',
			recommended_action: 'Review driver behavior and confirm route context.',
			related_trip_id: 'asset_001_trip_15',
			status: 'open'
		},
		{
			id: 'alert_002',
			type: 'Battery',
			title: 'Device battery trending low',
			asset_id: 'asset_003',
			asset_name: 'Scania R500',
			time: '2025-07-03T10:42:00Z',
			severity: 'medium',
			location_label: 'Redcliff Workshop',
			recommended_action: 'Schedule device inspection before next dispatch.',
			status: 'acknowledged'
		},
		{
			id: 'alert_003',
			type: 'Offline',
			title: 'Tracker offline beyond freshness window',
			asset_id: 'asset_004',
			asset_name: 'Isuzu NPR',
			time: '2025-07-03T07:12:00Z',
			severity: 'critical',
			location_label: 'Beitbridge Border Post',
			recommended_action: 'Confirm power supply and network coverage with field team.',
			status: 'open'
		}
	];

	const alertCounts = new Map<string, number>();
	for (const alert of alerts) {
		alertCounts.set(alert.asset_id, (alertCounts.get(alert.asset_id) ?? 0) + 1);
	}
	for (const asset of assets) {
		asset.active_alert_count = alertCounts.get(asset.id) ?? 0;
	}

	const drivers: FleetDriver[] = assets.map((asset, index) => ({
		id: `driver_${index + 1}`,
		name: asset.driver_name,
		asset_id: asset.id,
		status: 'assigned',
		score: asset.driver_behavior_score,
		contact: `+263 77${index + 1} 555 ${120 + index}`,
		shift_status: index < 3 ? 'on_shift' : 'between_jobs'
	}));

	drivers.push({
		id: 'driver_005',
		name: 'Unassigned Relief Driver',
		status: 'available',
		contact: '+263 774 555 125',
		shift_status: 'off_shift'
	});

	const devices: FleetDevice[] = assets.map((asset, index) => ({
		id: asset.device_id,
		device_id: asset.device_id,
		imei: asset.imei,
		model: index < 2 ? 'Teltonika FMC130' : 'Teltonika FMB920',
		assigned_vehicle: asset.name,
		assigned_asset_id: asset.id,
		last_packet: asset.last_update,
		signal_status: asset.signal_status,
		health_status: asset.device_health,
		firmware_version: index < 2 ? '03.27.11' : '04.02.08',
		sim_iccid: `8997101200000000${index + 1}`
	}));

	const geofences: FleetGeofence[] = [
		{
			id: 'geo_001',
			name: 'Kwekwe Depot',
			type: 'depot',
			center: [31.5577, -18.2143],
			polygon: [
				[31.5549, -18.2168],
				[31.5608, -18.2168],
				[31.5608, -18.2118],
				[31.5549, -18.2118],
				[31.5549, -18.2168]
			],
			vehicles_inside: ['asset_001'],
			entered_today: 6,
			exited_today: 5,
			avg_dwell_minutes: 48
		},
		{
			id: 'geo_002',
			name: 'Mvuma Mine Site',
			type: 'mine_site',
			center: [30.5283, -19.2798],
			polygon: [
				[30.5236, -19.2835],
				[30.5328, -19.2835],
				[30.5328, -19.2763],
				[30.5236, -19.2763],
				[30.5236, -19.2835]
			],
			vehicles_inside: ['asset_002'],
			entered_today: 3,
			exited_today: 2,
			avg_dwell_minutes: 113
		},
		{
			id: 'geo_003',
			name: 'Redcliff Workshop',
			type: 'workshop',
			center: [31.6032, -19.0109],
			polygon: [
				[31.6008, -19.0132],
				[31.6065, -19.0132],
				[31.6065, -19.0088],
				[31.6008, -19.0088],
				[31.6008, -19.0132]
			],
			vehicles_inside: ['asset_003'],
			entered_today: 3,
			exited_today: 2,
			avg_dwell_minutes: 113
		},
		{
			id: 'geo_004',
			name: 'Beitbridge Border Post',
			type: 'border_post',
			center: [29.9953, -22.2167],
			polygon: [
				[29.9911, -22.2203],
				[30.0004, -22.2203],
				[30.0004, -22.2133],
				[29.9911, -22.2133],
				[29.9911, -22.2203]
			],
			vehicles_inside: ['asset_004'],
			entered_today: 1,
			exited_today: 0,
			avg_dwell_minutes: 240
		},
		{
			id: 'geo_005',
			name: 'South Corridor No-Go',
			type: 'no_go_zone',
			center: [30.82, -20.55],
			polygon: [
				[30.808, -20.562],
				[30.832, -20.562],
				[30.832, -20.54],
				[30.808, -20.54],
				[30.808, -20.562]
			],
			vehicles_inside: [],
			entered_today: 0,
			exited_today: 0,
			avg_dwell_minutes: 0
		}
	];

	const reports: ReportDefinition[] = [
		{
			id: 'report_daily_summary',
			title: 'Daily Trip Summary',
			description: 'Distance, moving time, stops, and max speed by asset.',
			status: 'ready'
		},
		{
			id: 'report_idling',
			title: 'Parking and Idling',
			description: 'Spot long dwell time, idling, and route interruptions.',
			status: 'ready'
		},
		{
			id: 'report_distance_per_vehicle',
			title: 'Distance per Vehicle',
			description: 'Compare daily output by vehicle and assignment.',
			status: 'ready'
		},
		{
			id: 'report_utilization',
			title: 'Utilization',
			description: 'Prepare day and week utilization rollups for fleet review.',
			status: 'coming_soon'
		},
		{
			id: 'report_speed_violations',
			title: 'Speed Violations',
			description: 'Flag trips that exceeded speed policy thresholds.',
			status: 'coming_soon'
		},
		{
			id: 'report_trip_exceptions',
			title: 'Trip Exceptions',
			description: 'Summarize route interruptions, offline windows, and missed checks.',
			status: 'coming_soon'
		}
	];

	const routes: RouteSummary[] = [
		{
			id: 'route_001',
			name: 'Kwekwe Depot to Gweru Corridor',
			status: 'planned',
			origin: 'Kwekwe Depot',
			destination: 'Gweru Corridor',
			compliance_note: 'Geofence-linked compliance checks will land in OmniV3 integration.'
		},
		{
			id: 'route_002',
			name: 'Mine Site shuttle template',
			status: 'draft',
			origin: 'Mvuma Mine Site',
			destination: 'Redcliff Workshop',
			compliance_note: 'Saved routes placeholder for future dispatch planning.'
		},
		{
			id: 'route_003',
			name: 'Border dispatch workflow',
			status: 'coming_soon',
			origin: 'Beitbridge Border Post',
			destination: 'Regional handover',
			compliance_note: 'Planned route compliance and ETA monitoring will be added later.'
		}
	];

	const baseSummary = buildFleetSummary(
		assets.map((asset) => asset.status),
		alerts
	);
	const summary: DashboardSummary = {
		...baseSummary,
		today_distance_estimate_km: Number(
			assets.reduce((sum, asset) => sum + asset.today_distance_km, 0).toFixed(1)
		),
		active_exceptions: alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high')
			.length
	};

	return {
		hub: {
			id: 'hub_001',
			name: 'Omni Eye Command',
			subscription_tier: 'Pro',
			tenant_id: 'tenant_001'
		},
		summary,
		assets,
		alerts,
		drivers,
		devices,
		geofences,
		reports,
		routes,
		meta: {
			profile_token: rawData.profile_token,
			algo_version: rawData.algo_version,
			threshold_minutes: rawData.threshold_minutes,
			start_ts: rawData.start_ts,
			end_ts: rawData.end_ts
		}
	};
}

const MOCK_DELAY_MS = 120;

async function respond<T>(value: T): Promise<T> {
	await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
	return value;
}

export async function getFleetWorkspace(): Promise<FleetApiResult> {
	return respond({ data: buildWorkspaceData() });
}

export async function getDashboardSummary() {
	return respond(buildWorkspaceData().summary);
}

export async function getAssets() {
	return respond(buildWorkspaceData().assets);
}

export async function getAlerts() {
	return respond(buildWorkspaceData().alerts);
}

export async function getReports() {
	return respond(buildWorkspaceData().reports);
}

export async function getDrivers() {
	return respond(buildWorkspaceData().drivers);
}

export async function getDevices() {
	return respond(buildWorkspaceData().devices);
}

export async function getGeofences() {
	return respond(buildWorkspaceData().geofences);
}

export async function getRoutes() {
	return respond(buildWorkspaceData().routes);
}

export async function getTripsForAsset(assetId: string) {
	return respond(buildWorkspaceData().assets.find((asset) => asset.id === assetId)?.trips ?? []);
}
