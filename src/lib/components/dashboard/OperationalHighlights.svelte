<script lang="ts">
	import type { FleetWorkspaceData } from '$lib/types/telemetry';

	let { workspace }: { workspace: FleetWorkspaceData } = $props();

	const topDistanceAssets = [...workspace.assets]
		.sort((left, right) => right.today_distance_km - left.today_distance_km)
		.slice(0, 3);
</script>

<div class="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
	<section class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Operations today</div>
		<div class="mt-1 text-lg font-semibold text-white">Decision-making highlights</div>
		<div class="mt-4 grid gap-3 md:grid-cols-3">
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-sm text-slate-400">Distance estimate</div>
				<div class="mt-2 text-2xl font-semibold text-white">
					{workspace.summary.today_distance_estimate_km.toFixed(1)} km
				</div>
			</div>
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-sm text-slate-400">Active exceptions</div>
				<div class="mt-2 text-2xl font-semibold text-white">
					{workspace.summary.active_exceptions}
				</div>
			</div>
			<div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
				<div class="text-sm text-slate-400">Telemetry profile</div>
				<div class="mt-2 text-2xl font-semibold text-white">{workspace.meta.threshold_minutes}m</div>
			</div>
		</div>
	</section>

	<section class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Top distance</div>
		<div class="mt-1 text-lg font-semibold text-white">Assets carrying the day</div>
		<div class="mt-4 space-y-3">
			{#each topDistanceAssets as asset}
				<div class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
					<div class="flex items-center justify-between gap-3">
						<div>
							<div class="text-sm font-medium text-white">{asset.name}</div>
							<div class="mt-1 text-xs text-slate-400">
								{asset.registration} · {asset.driver_name}
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-semibold text-white">{asset.today_distance_km.toFixed(1)} km</div>
							<div class="mt-1 text-xs text-slate-400 capitalize">{asset.status}</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
