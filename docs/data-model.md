# Omni Eye Data Model Draft

## Schema Strategy

Preferred long-term database shape:

- PostgreSQL
- `app` schema for business entities
- `telemetry` schema for ingest, telemetry, derivation, and reporting entities

This repo does not merge schemas yet. It documents the separation and prepares contracts around it.

## Core App References

Telemetry records should reference these stable application identifiers:

- `tenant_id`
- `hub_id`
- `vehicle_id`
- `device_id`
- `driver_id` where available

## Telemetry Entities

### `telemetry.raw_packets`

- `id`
- `tenant_id`
- `hub_id`
- `device_id`
- `imei`
- `protocol`
- `packet_received_at_utc`
- `tracker_timestamp_utc_min`
- `tracker_timestamp_utc_max`
- `payload_hex`
- `payload_size_bytes`
- `crc_valid`
- `parse_status`
- `failure_reason`
- `ingest_session_id`
- `dedupe_key`
- `created_at_utc`

Purpose: raw lineage, debugging, audit, replay of parser failures.

### `telemetry.ingest_sessions`

- `id`
- `device_id`
- `imei`
- `remote_addr`
- `started_at_utc`
- `ended_at_utc`
- `packet_count`
- `accepted_packet_count`
- `rejected_packet_count`
- `last_error_code`

Purpose: operational traceability for long-running tracker connections.

### `telemetry.telemetry_points`

- `id`
- `tenant_id`
- `hub_id`
- `device_id`
- `vehicle_id`
- `raw_packet_id`
- `point_timestamp_utc`
- `lat`
- `lon`
- `altitude_m`
- `heading_deg`
- `speed_kmh`
- `satellite_count`
- `ignition`
- `odometer_m`
- `quality_flag`
- `dedupe_key`
- `created_at_utc`

Purpose: canonical source for live state, playback, and analytics.

### `telemetry.telemetry_io`

- `id`
- `telemetry_point_id`
- `io_key`
- `io_group`
- `raw_value`
- `normalized_value`
- `unit`

Purpose: flexible storage of Teltonika IO values without bloating the point table.

### `telemetry.trips`

- `id`
- `tenant_id`
- `hub_id`
- `device_id`
- `vehicle_id`
- `algorithm_version`
- `source_point_from_id`
- `source_point_to_id`
- `start_time_utc`
- `end_time_utc`
- `distance_m`
- `moving_seconds`
- `stopped_seconds`
- `max_speed_kmh`
- `avg_moving_speed_kmh`
- `start_geofence_id`
- `end_geofence_id`
- `recompute_batch_id`
- `created_at_utc`

Purpose: reproducible derived route segments for playback and reporting.

### `telemetry.trip_points`

- `trip_id`
- `telemetry_point_id`
- `sequence_no`
- `distance_from_start_m`
- `elapsed_seconds`

Purpose: stable trip playback ordering and packet inspection.

### `telemetry.stops`

- `id`
- `trip_id`
- `device_id`
- `vehicle_id`
- `start_time_utc`
- `end_time_utc`
- `duration_seconds`
- `lat`
- `lon`
- `geofence_id`
- `stop_type`
- `algorithm_version`

Purpose: parking, idling, and dwell analytics.

### `telemetry.alerts`

- `id`
- `tenant_id`
- `hub_id`
- `device_id`
- `vehicle_id`
- `trip_id`
- `telemetry_point_id`
- `alert_type`
- `severity`
- `status`
- `started_at_utc`
- `ended_at_utc`
- `title`
- `message`
- `metadata_json`

Purpose: operational attention queue and future rule engine outputs.

### `telemetry.daily_summaries`

- `id`
- `summary_date_utc`
- `tenant_id`
- `hub_id`
- `device_id`
- `vehicle_id`
- `distance_m`
- `moving_seconds`
- `idle_seconds`
- `parked_seconds`
- `trip_count`
- `max_speed_kmh`

### `telemetry.analytics_rollups`

- `id`
- `rollup_type`
- `window_start_utc`
- `window_end_utc`
- `tenant_id`
- `hub_id`
- `vehicle_id`
- `metric_key`
- `metric_value`
- `dimension_json`

### `telemetry.report_runs`

- `id`
- `report_type`
- `requested_by_user_id`
- `tenant_id`
- `hub_id`
- `parameters_json`
- `status`
- `started_at_utc`
- `completed_at_utc`
- `artifact_uri`

## Index Strategy

- `telemetry_points`: `(vehicle_id, point_timestamp_utc desc)`, `(device_id, point_timestamp_utc desc)`, `(hub_id, point_timestamp_utc desc)`
- `raw_packets`: `(device_id, packet_received_at_utc desc)`, unique `dedupe_key`
- `trips`: `(vehicle_id, start_time_utc desc)`, `(device_id, start_time_utc desc)`, `(hub_id, start_time_utc desc)`
- `alerts`: `(tenant_id, status, severity, started_at_utc desc)`
- `daily_summaries`: unique `(summary_date_utc, vehicle_id)`

## Partitioning And Retention

- Partition `raw_packets` by month on `packet_received_at_utc`
- Partition `telemetry_points` by month on `point_timestamp_utc`
- Retain raw packets longer than derived outputs for audit and debugging
- Rollups and report artifacts can be regenerated and may use cheaper retention policies

## Recompute Rules

- Trips and stops are derived, not hand-edited records
- Recompute scope should support `device_id` + date range and `vehicle_id` + date range
- Every recompute run stamps `algorithm_version`
- Same source points plus same algorithm version must produce the same trip outputs
- Recompute must never overwrite raw packet lineage

## Frontend Contract Direction

Frontend payloads should expose:

- stable asset IDs
- live state from the latest telemetry point
- trip summaries optimized for list and inspector views
- trip playback points already scoped to the selected trip
- alert summaries with asset linkage

The UI must not treat static exported JSON as its source of truth.
