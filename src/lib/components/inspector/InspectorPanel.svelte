<script lang="ts">
	import QuickReports from '$lib/components/reports/QuickReports.svelte';
	import type {
		FleetAlert,
		FleetAsset,
		InspectorContext,
		QuickReportItem,
		StopPoint,
		TripSummary
	} from '$lib/types/telemetry';
	import { formatDateLabel, formatDuration, formatTimeLabel } from '$lib/utils/telemetry/format';

	let {
		context,
		asset,
		trip,
		alert,
		stopPoints,
		reports,
		fleetMeta
	}: {
		context: InspectorContext;
		asset: FleetAsset | null;
		trip: TripSummary | null;
		alert: FleetAlert | null;
		stopPoints: StopPoint[];
		reports: QuickReportItem[];
		fleetMeta: {
			algo_version: string;
			threshold_minutes: number;
			start_ts: string;
			end_ts: string;
		};
	} = $props();
</script>

<aside class="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
	<div class="border-b border-white/8 px-5 py-4">
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Inspector</div>
		<h2 class="mt-1 text-lg font-semibold text-white">
			{context === 'alert'
				? (alert?.title ?? 'Alert context')
				: context === 'trip'
					? (trip?.name ?? 'Trip context')
					: (asset?.name ?? 'Asset context')}
		</h2>
		<p class="mt-1 text-sm text-slate-400">
			{context === 'alert'
				? 'Review severity, timing, and next action.'
				: context === 'trip'
					? 'Replay metrics, timing, and parking events.'
					: 'Current status, device health, and operating context.'}
		</p>
	</div>

	<div class="space-y-6 px-5 py-5">
		{#if asset}
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Status</div>
					<div class="mt-2 text-2xl font-semibold text-white capitalize">{asset.status}</div>
					<div class="text-sm text-slate-400">{asset.speed_kmh.toFixed(0)} km/h current</div>
				</div>
				<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Today distance</div>
					<div class="mt-2 text-2xl font-semibold text-white">
						{asset.today_distance_km.toFixed(1)}
					</div>
					<div class="text-sm text-slate-400">Kilometres covered</div>
				</div>
				<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Driving time</div>
					<div class="mt-2 text-2xl font-semibold text-white">
						{formatDuration(asset.today_driving_seconds)}
					</div>
					<div class="text-sm text-slate-400">Today</div>
				</div>
				<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
					<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Max speed</div>
					<div class="mt-2 text-2xl font-semibold text-white">
						{asset.max_speed_today_kmh.toFixed(0)}
					</div>
					<div class="text-sm text-slate-400">km/h today</div>
				</div>
			</div>

			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Asset details</div>
				<div class="mt-4 space-y-3 text-sm">
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Registration</span>
						<span class="text-white">{asset.registration}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Driver</span>
						<span class="text-white">{asset.driver_name}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Current geofence</span>
						<span class="text-right text-white">{asset.current_geofence ?? 'Unknown'}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Device health</span>
						<span class="text-white">{asset.device_health}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Fuel level</span>
						<span class="text-white"
							>{asset.fuel_level_pct != null ? `${asset.fuel_level_pct}%` : 'N/A'}</span
						>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Behavior score</span>
						<span class="text-white">
							{asset.driver_behavior_score != null ? asset.driver_behavior_score : 'N/A'}
						</span>
					</div>
				</div>
			</div>
		{/if}

		{#if context === 'trip' && trip}
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Trip summary</div>
				<div class="mt-4 space-y-3 text-sm">
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Start</span>
						<span class="text-right text-white">
							{formatDateLabel(trip.start_time)}<br />
							<span class="text-slate-500">{formatTimeLabel(trip.start_time)}</span>
						</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Finish</span>
						<span class="text-right text-white">
							{formatDateLabel(trip.end_time)}<br />
							<span class="text-slate-500">{formatTimeLabel(trip.end_time)}</span>
						</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Moving time</span>
						<span class="text-white">{formatDuration(trip.moving_seconds)}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Stopped time</span>
						<span class="text-white">{formatDuration(trip.stopped_seconds)}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Stops</span>
						<span class="text-white">{stopPoints.length}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Overspeed events</span>
						<span class="text-white">{trip.overspeed_event_count ?? 0}</span>
					</div>
				</div>
			</div>

			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Parking events</div>
				<div class="mt-1 text-base font-semibold text-white">Detected stops</div>
				{#if stopPoints.length}
					<div class="mt-4 space-y-3">
						{#each stopPoints as stop, index}
							<div class="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3">
								<div class="flex items-center justify-between gap-3">
									<div class="text-sm font-medium text-white">Stop {index + 1}</div>
									<div
										class="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300"
									>
										{formatDuration(stop.durationSec)}
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-400">
									{formatDateLabel(stop.start)}
									{formatTimeLabel(stop.start)} to {formatTimeLabel(stop.end)}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-500"
					>
						No parking events were detected for this replay using the current threshold.
					</div>
				{/if}
			</div>
		{/if}

		{#if context === 'alert' && alert}
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Alert details</div>
				<div class="mt-4 space-y-3 text-sm">
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Type</span>
						<span class="text-white">{alert.type}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Asset</span>
						<span class="text-white">{alert.asset_name}</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Time</span>
						<span class="text-right text-white">
							{formatDateLabel(alert.time)}<br />
							<span class="text-slate-500">{formatTimeLabel(alert.time)}</span>
						</span>
					</div>
					<div class="flex items-center justify-between border-b border-white/6 pb-3">
						<span class="text-slate-400">Location</span>
						<span class="text-right text-white">{alert.location_label}</span>
					</div>
					<div class="flex items-start justify-between gap-4">
						<span class="text-slate-400">Action</span>
						<span class="max-w-[180px] text-right text-white">{alert.recommended_action}</span>
					</div>
				</div>
			</div>
		{/if}

		<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
			<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Dataset context</div>
			<div class="mt-4 space-y-3 text-sm text-slate-400">
				<div class="flex items-center justify-between">
					<span>Algorithm version</span>
					<span class="text-white">{fleetMeta.algo_version}</span>
				</div>
				<div class="flex items-center justify-between">
					<span>Trip threshold</span>
					<span class="text-white">{fleetMeta.threshold_minutes} min</span>
				</div>
				<div class="flex items-center justify-between">
					<span>Coverage start</span>
					<span class="text-white">{formatDateLabel(fleetMeta.start_ts)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span>Coverage end</span>
					<span class="text-white">{formatDateLabel(fleetMeta.end_ts)}</span>
				</div>
			</div>
		</div>

		<QuickReports {reports} />
	</div>
</aside>
