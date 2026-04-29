#!/usr/bin/env python3
"""
Export Teltonika parser point data into the Omni Eye frontend trip JSON format.

Example:
    python3 scripts/export_teltonika_trips.py \
        --db /tmp/codec8py/python_gps_parser/gps_tracking.db \
        --imei 864636065545556 \
        --output src/routes/data.json
"""

from __future__ import annotations

import argparse
import json
import math
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


DEFAULT_THRESHOLD_MINUTES = 7
STOP_SPEED_KMH = 1.0
MIN_MOVEMENT_METERS = 0.02


@dataclass
class Point:
    ts: datetime
    lat: float
    lon: float
    speed_kmh: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export SQLite GPS records into Omni Eye trip playback JSON."
    )
    parser.add_argument("--db", required=True, help="Path to sqlite database with gps_records")
    parser.add_argument("--imei", help="Device IMEI to export. Required when DB has multiple devices.")
    parser.add_argument(
        "--output",
        default="src/routes/data.json",
        help="Output JSON path. Defaults to src/routes/data.json",
    )
    parser.add_argument(
        "--threshold-minutes",
        type=float,
        default=DEFAULT_THRESHOLD_MINUTES,
        help="Start a new trip when the timestamp gap exceeds this many minutes.",
    )
    parser.add_argument(
        "--profile-token",
        default="Teltonika",
        help="Value to store in profile_token.",
    )
    parser.add_argument(
        "--algo-version",
        default="codec8py-bridge-v1",
        help="Value to store in algo_version.",
    )
    return parser.parse_args()


def parse_sqlite_timestamp(value: str) -> datetime:
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    raise ValueError(f"Unsupported timestamp format: {value}")


def iso_without_tz(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat(timespec="seconds")


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_m = 6_371_000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * radius_m * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def choose_imei(connection: sqlite3.Connection, imei: str | None) -> str:
    rows = connection.execute(
        "SELECT imei, COUNT(*) AS count FROM gps_records GROUP BY imei ORDER BY count DESC, imei ASC"
    ).fetchall()
    if not rows:
        raise SystemExit("No gps_records found in database.")

    if imei:
        valid = {row[0] for row in rows}
        if imei not in valid:
            raise SystemExit(f"IMEI {imei} not found. Available IMEIs: {', '.join(sorted(valid))}")
        return imei

    if len(rows) == 1:
        return rows[0][0]

    summary = ", ".join(f"{device} ({count} rows)" for device, count in rows)
    raise SystemExit(f"Multiple devices found. Re-run with --imei. Available: {summary}")


def load_points(connection: sqlite3.Connection, imei: str) -> list[Point]:
    rows = connection.execute(
        """
        SELECT timestamp, latitude, longitude, speed
        FROM gps_records
        WHERE imei = ?
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND timestamp IS NOT NULL
        ORDER BY timestamp ASC, id ASC
        """,
        (imei,),
    ).fetchall()

    points: list[Point] = []
    previous_key = None
    for ts_raw, lat, lon, speed in rows:
        point = Point(
            ts=parse_sqlite_timestamp(ts_raw),
            lat=float(lat),
            lon=float(lon),
            speed_kmh=float(speed or 0),
        )
        point_key = (point.ts, point.lat, point.lon, point.speed_kmh)
        if point_key == previous_key:
            continue
        points.append(point)
        previous_key = point_key
    return points


def segment_trips(points: Iterable[Point], threshold_seconds: float) -> list[list[Point]]:
    trips: list[list[Point]] = []
    current: list[Point] = []

    for point in points:
        if not current:
            current = [point]
            continue

        gap_seconds = (point.ts - current[-1].ts).total_seconds()
        if gap_seconds > threshold_seconds:
            trips.append(current)
            current = [point]
        else:
            current.append(point)

    if current:
        trips.append(current)

    return trips


def summarize_trip(points: list[Point], next_trip_start: datetime | None) -> dict:
    start = points[0]
    end = points[-1]

    distance_m = 0.0
    moving_seconds = 0
    in_trip_stopped_seconds = 0

    for prev, curr in zip(points, points[1:]):
        dt_seconds = max(0, int((curr.ts - prev.ts).total_seconds()))
        segment_distance_m = haversine_meters(prev.lat, prev.lon, curr.lat, curr.lon)
        distance_m += segment_distance_m

        is_moving = (
            prev.speed_kmh > STOP_SPEED_KMH
            or curr.speed_kmh > STOP_SPEED_KMH
            or segment_distance_m > MIN_MOVEMENT_METERS
        )
        if is_moving:
            moving_seconds += dt_seconds
        else:
            in_trip_stopped_seconds += dt_seconds

    gap_to_next_seconds = 0
    if next_trip_start is not None:
        gap_to_next_seconds = max(0, int((next_trip_start - end.ts).total_seconds()))

    total_stopped_seconds = in_trip_stopped_seconds + gap_to_next_seconds
    distance_km = round(distance_m / 1000, 3)
    max_speed_kmh = round(max(point.speed_kmh for point in points), 1)
    avg_moving_speed_kmh = round(
        (distance_m / 1000) / (moving_seconds / 3600), 1
    ) if moving_seconds > 0 and distance_m > 0 else 0.0

    return {
        "start_time": iso_without_tz(start.ts),
        "end_time": iso_without_tz(end.ts),
        "start_lat": round(start.lat, 7),
        "start_lon": round(start.lon, 7),
        "end_lat": round(end.lat, 7),
        "end_lon": round(end.lon, 7),
        "moving_seconds": moving_seconds,
        "stopped_seconds": total_stopped_seconds,
        "distance_km": distance_km,
        "max_speed_kmh": max_speed_kmh,
        "avg_moving_speed_kmh": avg_moving_speed_kmh,
        "points": [
            {
                "ts": iso_without_tz(point.ts),
                "lat": round(point.lat, 7),
                "lon": round(point.lon, 7),
                "speed_kmh": round(point.speed_kmh, 1),
            }
            for point in points
        ],
    }


def build_payload(
    imei: str,
    profile_token: str,
    threshold_minutes: float,
    algo_version: str,
    points: list[Point],
) -> dict:
    if not points:
        raise SystemExit(f"No GPS points found for IMEI {imei}.")

    threshold_seconds = threshold_minutes * 60
    raw_trips = segment_trips(points, threshold_seconds)
    trips = [
        summarize_trip(
            trip_points,
            raw_trips[index + 1][0].ts if index + 1 < len(raw_trips) else None,
        )
        for index, trip_points in enumerate(raw_trips)
    ]

    return {
        "device_imei": imei,
        "profile_token": profile_token,
        "threshold_minutes": threshold_minutes,
        "algo_version": algo_version,
        "start_ts": iso_without_tz(points[0].ts),
        "end_ts": iso_without_tz(points[-1].ts),
        "trips": trips,
        "_device_ver": "codec8py-export",
        "_latest_ts": iso_without_tz(points[-1].ts),
    }


def main() -> None:
    args = parse_args()
    db_path = Path(args.db)
    output_path = Path(args.output)

    if not db_path.exists():
        raise SystemExit(f"Database not found: {db_path}")

    connection = sqlite3.connect(db_path)
    try:
        imei = choose_imei(connection, args.imei)
        points = load_points(connection, imei)
    finally:
        connection.close()

    payload = build_payload(
        imei=imei,
        profile_token=args.profile_token,
        threshold_minutes=args.threshold_minutes,
        algo_version=args.algo_version,
        points=points,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    print(f"Exported {len(payload['trips'])} trips for IMEI {imei} -> {output_path}")


if __name__ == "__main__":
    main()
