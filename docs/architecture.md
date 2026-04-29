# Omni Eye Architecture

## Purpose

Omni Eye is evolving from a telemetry replay prototype into a fleet telemetry product surface for Omni Logistics. The product must stay operationally separated from the broader OmniV3 business domain while converging toward one user-facing platform.

## Boundary Model

- `app` domain owns users, auth, roles, hubs, vehicles, tenants, device assignments, and business metadata.
- `telemetry` domain owns raw packets, normalized telemetry, derived trips, stops, alerts, rollups, and reports.
- Short term: telemetry runs in its own storage boundary and service surface.
- Medium term: OmniV3 integrates through stable IDs and API contracts.
- Long term: preferred deployment target is one PostgreSQL instance with separate schemas: `app` and `telemetry`.

## Product Layers

1. Ingest
   Python runtime receives raw Teltonika traffic, validates packets, and stores raw ingest metadata.
2. Parsing
   Codec 8 / AVL parsing converts packets into normalized telemetry points and IO values.
3. Canonical Storage
   Telemetry points become the canonical playback and analytics source of truth.
4. Derivation
   Trips, stops, alerts, summaries, and rollups are reproducible outputs from canonical points.
5. API Layer
   Fleet UI and future OmniV3 consumers use API contracts, not direct database access or exported JSON files.
6. Operations UI
   One workspace supports live tracking, replay, alerts, and operational context.
7. Reporting
   Reports and analytics derive from the same telemetry truth used by live tracking and playback.

## Repo Direction

### Current state

- SvelteKit frontend for replay and inspection
- Python SQLite export bridge
- Static JSON prototype dataset

### Near-term repo modules

- `docs/`
  Product, schema, API, and UI decisions
- `scripts/`
  Python ingest/export tooling until the ingest service is hardened
- `src/lib/api/`
  API adapters and mock service layer
- `src/lib/types/`
  Canonical frontend contracts
- `src/lib/utils/telemetry/`
  Formatting, status, and telemetry helpers
- `src/lib/utils/trips/`
  Playback, stop detection, and trip-specific helpers
- `src/lib/stores/`
  Shared workspace state when state moves beyond page-local orchestration
- `src/lib/components/`
  Fleet operations UI modules

## Ownership Map

- Python ingest runtime remains responsible for Teltonika connectivity and parser hardening.
- Telemetry service layer owns normalized storage, derivation, and query contracts.
- SvelteKit UI owns fleet operations workflows and API consumption.
- OmniV3 later owns authentication, authorization, shared IDs, and shell navigation integration.

## Deployment Model

- Ingest service: Python process, long-running, observability-first.
- Telemetry API: separate service boundary, initially mockable inside this repo.
- UI: SvelteKit app that consumes telemetry endpoints.
- Database target: PostgreSQL with retention, indexing, and later schema separation.

## Integration Assumptions

- Telemetry records always reference stable IDs such as `device_id`, `vehicle_id`, `hub_id`, and `tenant_id`.
- IMEI remains an ingest identifier, not the long-term product identity.
- Realtime starts with polling and can later add SSE or WebSocket delivery without changing the domain model.
- Replay and live mode must share the same asset model and telemetry source.
