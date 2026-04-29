# Omni Eye Parser

Omni Eye Parser is a SvelteKit trip replay workspace for GPS telemetry exported from Teltonika tracker data.

It pairs with the Python `codec8py` parser workflow:

- `codec8py` ingests raw Teltonika AVL / Codec 8 tracker packets over TCP
- tracker points are stored in SQLite or another configured database
- this app converts those stored point records into trip-shaped JSON
- the UI replays trips on a map with route progress, parking detection, speed playback, and trip inspection

## What This Repo Contains

- a SvelteKit frontend for trip replay and telemetry inspection
- a bridge exporter at [scripts/export_teltonika_trips.py](./scripts/export_teltonika_trips.py)
- a sample trip dataset at [src/routes/data.json](./src/routes/data.json)

## Current UI

The current app is structured as an operations workspace inspired by Omni Logistics:

- left rail: trip history and filters
- center workspace: live replay map and playback controls
- right inspector: trip KPIs, timings, and detected parking events

## Data Shape

The frontend expects JSON like:

```json
{
  "device_imei": "352592577368475",
  "profile_token": "Teltonika",
  "threshold_minutes": 7,
  "algo_version": "codec8py-bridge-v1",
  "start_ts": "2025-07-02T07:03:18",
  "end_ts": "2025-07-03T11:21:05",
  "trips": [
    {
      "start_time": "2025-07-02T11:37:42",
      "end_time": "2025-07-02T11:40:10",
      "start_lat": -18.214305,
      "start_lon": 31.5577066,
      "end_lat": -18.2141,
      "end_lon": 31.558,
      "moving_seconds": 120,
      "stopped_seconds": 45,
      "distance_km": 0.8,
      "max_speed_kmh": 54.0,
      "avg_moving_speed_kmh": 37.5,
      "points": [
        {
          "ts": "2025-07-02T11:37:42",
          "lat": -18.214305,
          "lon": 31.5577066,
          "speed_kmh": 0.0
        }
      ]
    }
  ]
}
```

## Exporting From Teltonika Parser Data

If you already have a SQLite database produced by the Teltonika parser, export it into the frontend format with:

```bash
python3 scripts/export_teltonika_trips.py \
  --db /path/to/gps_tracking.db \
  --imei 352592577368475 \
  --output src/routes/data.json
```

Useful options:

- `--threshold-minutes`: split trips when inactivity gaps exceed the threshold
- `--profile-token`: label the source profile
- `--algo-version`: stamp the export version into the JSON

If your database has multiple devices, `--imei` is required.

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

## Notes

- The app currently uses static JSON at `src/routes/data.json`
- OSRM is used optionally for snap-to-roads playback
- local production builds may fail under unsupported Node versions because of `@sveltejs/adapter-vercel`

## Related Workflow

Typical flow:

1. ingest raw tracker packets with the Python parser
2. store normalized GPS points in the parser database
3. export points into trip JSON with `export_teltonika_trips.py`
4. replay those trips in Omni Eye
