import type { TelemetryPoint, TripSummary } from '$lib/types/telemetry';

export const DEFAULT_MAP_CENTER: [number, number] = [29.84893, -18.8983116];
export const MAX_KMH = 180;

export function reverseCoords(lat?: number, lon?: number) {
	return Number.isFinite(lat) && Number.isFinite(lon) ? ([lon, lat] as [number, number]) : null;
}

export function getTripBounds(trip: TripSummary | null | undefined) {
	if (!trip?.points?.length) {
		return { tripStartMs: 0, tripEndMs: 0 };
	}

	return {
		tripStartMs: new Date(trip.points[0].ts).getTime(),
		tripEndMs: new Date(trip.points[trip.points.length - 1].ts).getTime()
	};
}

export function getInterpolatedState(points: TelemetryPoint[], timeMs: number) {
	if (!points.length) return { lon: null, lat: null };
	if (points.length === 1) return points[0];

	const start = new Date(points[0].ts).getTime();
	const end = new Date(points[points.length - 1].ts).getTime();
	if (timeMs <= start) return points[0];
	if (timeMs >= end) return points[points.length - 1];

	let index = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const a = new Date(points[i].ts).getTime();
		const b = new Date(points[i + 1].ts).getTime();
		if (timeMs >= a && timeMs <= b) {
			index = i;
			break;
		}
	}

	const current = points[index];
	const next = points[index + 1];
	const startMs = new Date(current.ts).getTime();
	const endMs = new Date(next.ts).getTime();
	const ratio = Math.max(0, Math.min(1, (timeMs - startMs) / Math.max(1, endMs - startMs)));

	return {
		lon: current.lon + (next.lon - current.lon) * ratio,
		lat: current.lat + (next.lat - current.lat) * ratio
	};
}

export function getNearestPacketSpeed(points: TelemetryPoint[], timeMs: number) {
	if (!points.length) return 0;
	if (points.length === 1) return Number(points[0].speed_kmh) || 0;

	const start = new Date(points[0].ts).getTime();
	const end = new Date(points[points.length - 1].ts).getTime();
	if (timeMs <= start) return Number(points[0].speed_kmh) || 0;
	if (timeMs >= end) return Number(points[points.length - 1].speed_kmh) || 0;

	let index = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const a = new Date(points[i].ts).getTime();
		const b = new Date(points[i + 1].ts).getTime();
		if (timeMs >= a && timeMs <= b) {
			index = i;
			break;
		}
	}

	const a = new Date(points[index].ts).getTime();
	const b = new Date(points[index + 1].ts).getTime();
	const chosen = Math.abs(timeMs - a) <= Math.abs(b - timeMs) ? points[index] : points[index + 1];
	return Number.isFinite(chosen?.speed_kmh) ? chosen.speed_kmh : 0;
}

export function getProgressLineCoordinates(
	points: TelemetryPoint[],
	playbackTime: number,
	sourceCoordinates: [number, number][]
) {
	if (points.length < 2) return [];

	let index = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const a = new Date(points[i].ts).getTime();
		const b = new Date(points[i + 1].ts).getTime();
		if (playbackTime >= a && playbackTime <= b) {
			index = i;
			break;
		}
	}

	const start = points[index];
	const end = points[index + 1];
	const startMs = new Date(start.ts).getTime();
	const endMs = new Date(end.ts).getTime();
	const ratio = Math.min(1, Math.max(0, (playbackTime - startMs) / Math.max(1, endMs - startMs)));

	return [
		...sourceCoordinates.slice(0, index + 1),
		[start.lon + (end.lon - start.lon) * ratio, start.lat + (end.lat - start.lat) * ratio] as [
			number,
			number
		]
	];
}

export function buildCombinedTrip(trips: TripSummary[], assetId: string): TripSummary | null {
	if (!trips.length) return null;

	const allPoints = trips
		.flatMap((trip) =>
			(trip.points ?? []).filter(
				(point) => Number.isFinite(point.lon) && Number.isFinite(point.lat)
			)
		)
		.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

	if (allPoints.length < 2) return null;

	const startPoint = allPoints[0];
	const endPoint = allPoints[allPoints.length - 1];
	const distanceKm = trips.reduce((sum, trip) => sum + (Number(trip.distance_km) || 0), 0);
	const maxSpeed = trips.reduce(
		(max, trip) => Math.max(max, Number.isFinite(trip.max_speed_kmh) ? trip.max_speed_kmh : 0),
		0
	);

	let weighted = 0;
	let durationSum = 0;
	for (const trip of trips) {
		const start = new Date(trip.start_time).getTime();
		const end = new Date(trip.end_time).getTime();
		const duration = Math.max(0, end - start) / 1000;
		const avg = Number.isFinite(trip.avg_moving_speed_kmh) ? trip.avg_moving_speed_kmh : 0;
		weighted += duration * avg;
		durationSum += duration;
	}

	return {
		id: `combined_${trips[0].id}_${trips[trips.length - 1].id}`,
		asset_id: assetId,
		name: `Combined ${trips.length} trips`,
		start_time: trips[0].start_time,
		end_time: trips[trips.length - 1].end_time,
		start_lat: startPoint.lat,
		start_lon: startPoint.lon,
		end_lat: endPoint.lat,
		end_lon: endPoint.lon,
		moving_seconds: trips.reduce((sum, trip) => sum + (trip.moving_seconds || 0), 0),
		stopped_seconds: trips.reduce((sum, trip) => sum + (trip.stopped_seconds || 0), 0),
		distance_km: distanceKm,
		max_speed_kmh: maxSpeed,
		avg_moving_speed_kmh: durationSum > 0 ? weighted / durationSum : 0,
		start_label: trips[0].start_label,
		end_label: trips[trips.length - 1].end_label,
		status: 'replayable',
		points: allPoints,
		stop_count: 0,
		overspeed_event_count: 0,
		algorithm_version: trips[0].algorithm_version,
		is_combined: true
	};
}
