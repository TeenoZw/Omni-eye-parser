# Omni Eye API Contract Draft

## Principles

- APIs serve the fleet UI directly
- Live and replay data come from the same canonical telemetry source
- Responses are tenant and hub scoped by the app domain
- Errors are predictable and machine-readable
- Pagination and filters are explicit

## Conventions

- Base path: `/api/telemetry`
- Timestamps: ISO 8601 UTC
- Pagination: `page`, `page_size`, `next_cursor` where cursor pagination is preferable
- Filtering: query params for time ranges, asset IDs, hub IDs, status, severity
- Error shape:

```json
{
	"error": {
		"code": "trip_not_found",
		"message": "Trip trip_123 was not found for the current tenant.",
		"details": {
			"trip_id": "trip_123"
		},
		"request_id": "req_abc123"
	}
}
```

## Core Contracts

### `GET /api/telemetry/assets`

Purpose: populate the left operations rail and top health summary.

Response shape:

```json
{
	"hub": {
		"id": "hub_001",
		"name": "Omni Demo Fleet",
		"subscription_tier": "Pro"
	},
	"summary": {
		"total_assets": 4,
		"moving": 1,
		"idle": 1,
		"parked": 1,
		"offline": 1,
		"active_alerts": 3
	},
	"assets": [
		{
			"id": "asset_001",
			"vehicle_id": "veh_001",
			"device_id": "dev_001",
			"name": "Toyota Hilux",
			"registration": "ACF 1234",
			"driver_name": "T. Moyo",
			"status": "moving",
			"ignition": true,
			"speed_kmh": 67,
			"last_update": "2025-07-03T11:21:05Z",
			"location_label": "Near Kwekwe CBD",
			"lat": -18.2143,
			"lon": 31.5577,
			"signal_status": "fresh",
			"subscription_tier": "Pro",
			"active_alert_count": 1
		}
	]
}
```

### `GET /api/telemetry/assets/:assetId/live`

Purpose: latest known asset state for live mode and inspector.

Response includes:

- live asset summary
- latest point
- derived status
- today summary
- device health snippet

### `GET /api/telemetry/assets/:assetId/telemetry`

Query params:

- `from`
- `to`
- `page_size`
- `cursor`

Purpose: raw or normalized point history for inspections, graphs, and exports.

### `GET /api/telemetry/assets/:assetId/trips`

Query params:

- `from`
- `to`
- `status`
- `page`
- `page_size`

Purpose: replay queue and historical trip history.

Trip list item shape:

```json
{
	"id": "trip_240703_001",
	"asset_id": "asset_001",
	"start_time": "2025-07-03T08:12:00Z",
	"end_time": "2025-07-03T09:05:00Z",
	"distance_km": 42.6,
	"moving_seconds": 2740,
	"stopped_seconds": 440,
	"max_speed_kmh": 92,
	"avg_moving_speed_kmh": 56.1,
	"start_label": "Kwekwe Depot",
	"end_label": "Gweru CBD",
	"stop_count": 2,
	"overspeed_event_count": 1,
	"algorithm_version": "trip-v1"
}
```

### `GET /api/telemetry/trips/:tripId`

Purpose: inspector summary for one selected trip.

### `GET /api/telemetry/trips/:tripId/playback`

Purpose: map replay payload.

Response includes:

- trip summary
- ordered trip points
- stop markers
- alert markers
- packet lineage references when needed for drill-down

### `GET /api/telemetry/trips/:tripId/stops`

Purpose: explicit stop list for playback and reporting.

### `GET /api/telemetry/alerts`

Query params:

- `status`
- `severity`
- `asset_id`
- `from`
- `to`

Purpose: active alerts list and operator attention workflows.

### `GET /api/telemetry/reports/daily`

Purpose: daily summary report and export workflows.

### `GET /api/telemetry/analytics/utilization`

Purpose: utilization trends by vehicle, hub, or tenant.

### `GET /api/telemetry/analytics/idling`

Purpose: idling report and dashboard metrics.

### `POST /api/telemetry/trips/recompute`

Purpose: controlled backfill of derived trips.

Request body:

```json
{
	"device_id": "dev_001",
	"from": "2025-07-01T00:00:00Z",
	"to": "2025-07-03T23:59:59Z",
	"algorithm_version": "trip-v2"
}
```

Response shape:

```json
{
	"job_id": "recompute_001",
	"status": "queued"
}
```

## Auth And Scoping

- OmniV3 eventually supplies auth, tenant, hub, and permission context
- Telemetry APIs should already assume scoped access instead of exposing global fleet data
- Asset and trip IDs should be opaque stable identifiers, not IMEI-only keys
