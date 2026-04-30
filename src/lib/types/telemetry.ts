export type AssetStatus = 'moving' | 'idle' | 'parked' | 'offline';
export type WorkspaceMode = 'live' | 'replay';
export type SignalStatus = 'fresh' | 'delayed' | 'stale' | 'offline';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type InspectorContext = 'asset' | 'trip' | 'alert';
export type LeftTab = 'assets' | 'trips' | 'alerts' | 'drivers';
export type ReportStatus = 'ready' | 'coming_soon';
export type GeofenceType =
	| 'depot'
	| 'customer_site'
	| 'mine_site'
	| 'border_post'
	| 'no_go_zone'
	| 'workshop';

export interface NavigationItem {
	id: string;
	label: string;
	href: string;
	description?: string;
}

export interface HubSummary {
	id: string;
	name: string;
	subscription_tier: string;
	tenant_id?: string;
}

export interface TelemetryPoint {
	ts: string;
	lat: number;
	lon: number;
	speed_kmh: number;
	ignition?: boolean;
}

export interface StopPoint {
	id: string;
	lnglat: [number, number];
	durationSec: number;
	start: string;
	end: string;
	label: string;
}

export interface TripSummary {
	id: string;
	asset_id: string;
	name: string;
	start_time: string;
	end_time: string;
	start_lat: number;
	start_lon: number;
	end_lat: number;
	end_lon: number;
	moving_seconds: number;
	stopped_seconds: number;
	distance_km: number;
	max_speed_kmh: number;
	avg_moving_speed_kmh: number;
	start_label: string;
	end_label: string;
	status: 'ready' | 'replayable';
	points: TelemetryPoint[];
	stop_count?: number;
	overspeed_event_count?: number;
	algorithm_version?: string;
	is_combined?: boolean;
}

export interface FleetAsset {
	id: string;
	asset_id?: string;
	vehicle_id: string;
	device_id: string;
	hub_id?: string;
	tenant_id?: string;
	imei: string;
	name: string;
	registration: string;
	driver_name: string;
	status: AssetStatus;
	ignition: boolean;
	speed_kmh: number;
	last_update: string;
	location_label: string;
	lat: number;
	lon: number;
	signal_status: SignalStatus;
	subscription_tier: string;
	active_alert_count: number;
	current_geofence?: string;
	today_distance_km: number;
	today_driving_seconds: number;
	today_idle_seconds: number;
	max_speed_today_kmh: number;
	fuel_level_pct?: number;
	driver_behavior_score?: number;
	device_health: string;
	trips: TripSummary[];
}

export interface FleetAlert {
	id: string;
	type: string;
	title: string;
	asset_id: string;
	asset_name: string;
	time: string;
	severity: AlertSeverity;
	location_label: string;
	recommended_action: string;
	status?: 'open' | 'acknowledged' | 'resolved';
	related_trip_id?: string;
}

export interface FleetDriver {
	id: string;
	name: string;
	asset_id?: string;
	status: 'assigned' | 'available' | 'off_shift';
	score?: number;
	contact?: string;
	shift_status?: 'on_shift' | 'between_jobs' | 'off_shift';
}

export interface DeviceSummary {
	device_id: string;
	imei: string;
	model: string;
	assigned_asset_id: string;
	assigned_vehicle: string;
	last_packet: string;
	signal_status: SignalStatus;
	health_status: string;
	firmware_version?: string;
	sim_iccid?: string;
}

export interface FleetDevice extends DeviceSummary {
	id: string;
}

export interface GeofenceSummary {
	id: string;
	name: string;
	type: GeofenceType;
	center: [number, number];
	polygon: [number, number][];
	vehicles_inside: string[];
	entered_today: number;
	exited_today: number;
	avg_dwell_minutes: number;
}

export interface FleetGeofence extends GeofenceSummary {}

export interface ReportDefinition {
	id: string;
	title: string;
	description: string;
	status: ReportStatus;
}

export interface QuickReportItem extends ReportDefinition {}

export interface RouteSummary {
	id: string;
	name: string;
	status: 'planned' | 'draft' | 'coming_soon';
	origin: string;
	destination: string;
	compliance_note: string;
}

export interface FleetSummary {
	total_assets: number;
	moving: number;
	idle: number;
	parked: number;
	offline: number;
	active_alerts: number;
}

export interface DashboardSummary extends FleetSummary {
	today_distance_estimate_km: number;
	active_exceptions: number;
}

export interface FleetWorkspaceData {
	hub: HubSummary;
	summary: DashboardSummary;
	assets: FleetAsset[];
	alerts: FleetAlert[];
	drivers: FleetDriver[];
	devices: FleetDevice[];
	geofences: FleetGeofence[];
	reports: ReportDefinition[];
	routes: RouteSummary[];
	meta: {
		profile_token: string;
		algo_version: string;
		threshold_minutes: number;
		start_ts: string;
		end_ts: string;
	};
}

export interface FleetApiResult {
	data: FleetWorkspaceData;
}
