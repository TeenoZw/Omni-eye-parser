import type { StopPoint, TelemetryPoint } from '$lib/types/telemetry';

export const STOP_SPEED_KMH = 1;
export const STOP_MIN_DURATION_S = 30;

export function detectStopPoints(points: TelemetryPoint[]): StopPoint[] {
	if (points.length < 2) return [];

	const stops: StopPoint[] = [];
	let run: TelemetryPoint[] = [];
	const toMs = (ts: string) => new Date(ts).getTime();

	function flushRun() {
		if (!run.length) return;
		const duration = Math.floor((toMs(run[run.length - 1].ts) - toMs(run[0].ts)) / 1000);
		if (duration < STOP_MIN_DURATION_S) {
			run = [];
			return;
		}

		const total = run.reduce(
			(sum, item) => ({ lon: sum.lon + (item.lon ?? 0), lat: sum.lat + (item.lat ?? 0) }),
			{ lon: 0, lat: 0 }
		);
		const durationMinutes = Math.max(1, Math.round(duration / 60));

		stops.push({
			id: `stop_${run[0].ts}`,
			lnglat: [total.lon / run.length, total.lat / run.length],
			durationSec: duration,
			start: run[0].ts,
			end: run[run.length - 1].ts,
			label: `Park ${durationMinutes}m`
		});
		run = [];
	}

	for (const point of points) {
		const speed = Number.isFinite(point.speed_kmh) ? point.speed_kmh : 0;
		if (speed <= STOP_SPEED_KMH) {
			run.push(point);
		} else {
			flushRun();
		}
	}

	flushRun();
	return stops;
}
