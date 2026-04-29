# Omni Eye UI Plan

## Product Goal

The UI should feel like one fleet operations workspace where live visibility and historical replay are two modes of the same product, not two disconnected tools.

## Core Layout

- Top bar
  Omni Eye branding, fleet health, search shell, hub context, environment status
- Left rail
  Operational tabs: Assets, Trips, Alerts, Drivers
- Center stage
  Map-first workspace with live and replay overlays
- Right inspector
  Context-aware details for selected asset, trip, or alert
- Bottom drawer
  Timeline and report-oriented detail, not permanent clutter

## First MVP Pass In This Repo

### Included

- Fleet health bar
- Asset-first operational list
- Live and replay mode toggle
- Multi-asset mock support
- Large map workspace
- Trip list and replay controls
- Alerts panel
- Inspector panel
- Quick report entry points
- Loading, empty, and error states
- Mock API abstraction

### Deferred

- Billing and subscriptions management
- Full admin console
- Advanced report builder
- OmniV3 shell merge
- Realtime sockets
- Geofence editor
- Fuel and driver behavior deep analytics

## UI Behavior Rules

- The map is the stage
- Panels are operational instruments
- Assets tab is the default starting point
- Selecting an asset updates the map and inspector
- Replay uses the currently selected asset model
- Replay controls appear when a replayable trip is selected
- Empty states should explain what the operator can do next

## Visual Direction

- Dark operational map workspace
- Slate surfaces with white or near-white panel content contrast
- Omni cyan accent, no purple-forward styling
- Compact pills and badges for status
- Rounded panels with restrained shadows
- Minimal motion, mostly for progress and state transitions

## Component Direction

- `AppShell.svelte`
  Overall workspace frame
- `AssetList.svelte` and `AssetCard.svelte`
  Fleet visibility and fast selection
- `TripList.svelte`
  Historical trip queue and replay entry
- `FleetMap.svelte`
  Map rendering, overlays, and live/replay markers
- `MapToolbar.svelte`
  Contextual map actions
- `TripReplayControls.svelte`
  Bottom playback bar
- `AlertList.svelte`
  Attention queue
- `InspectorPanel.svelte`
  Asset/trip/alert context
- `QuickReports.svelte`
  Minimal reporting entry points

## UX Intent

- The first question answered is where the fleet is now
- The second is what needs attention
- Replay remains powerful, but it is no longer the only door into the product
