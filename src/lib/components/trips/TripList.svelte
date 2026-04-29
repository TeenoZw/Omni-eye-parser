<script lang="ts">
	import type { TripSummary } from '$lib/types/telemetry';
	import { formatDateLabel, formatTimeLabel } from '$lib/utils/telemetry/format';

	let {
		trips,
		selectedTripId,
		selectedRange,
		multiSelectMode = false,
		isPlaying = false,
		onSelect,
		onPreview,
		onTogglePlay,
		onToggleRange,
		onPlayCombined,
		onClearSelection
	}: {
		trips: TripSummary[];
		selectedTripId?: string;
		selectedRange: { s: number; e: number } | null;
		multiSelectMode?: boolean;
		isPlaying?: boolean;
		onSelect: (trip: TripSummary) => void;
		onPreview: (trip: TripSummary) => void;
		onTogglePlay: (trip: TripSummary) => void;
		onToggleRange: (trip: TripSummary) => void;
		onPlayCombined: () => void;
		onClearSelection: () => void;
	} = $props();
</script>

<div class="space-y-3">
	{#if selectedRange}
		<div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-4 py-3">
			<div class="text-sm font-medium text-white">
				Selected trips {selectedRange.s + 1} to {selectedRange.e + 1}
			</div>
			<div class="mt-1 text-xs text-slate-400">Replay consecutive runs as one route.</div>
			<div class="mt-3 flex items-center gap-2">
				<button
					type="button"
					onclick={onPlayCombined}
					class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
				>
					Replay selection
				</button>
				<button
					type="button"
					onclick={onClearSelection}
					class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
				>
					Clear
				</button>
			</div>
		</div>
	{/if}

	{#if trips.length}
		<div class="space-y-2">
			{#each trips as trip, index}
				{@const isCurrentTrip = trip.id === selectedTripId}
				<div
					class={`rounded-2xl border px-4 py-3 transition ${
						isCurrentTrip
							? 'border-cyan-400/50 bg-cyan-400/10'
							: 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
					}`}
				>
					<button type="button" onclick={() => onSelect(trip)} class="w-full text-left">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<div class="text-sm font-semibold text-white">
										{trip.name || `Trip ${index + 1}`}
									</div>
									{#if isCurrentTrip}
										<div
											class="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-cyan-300 uppercase"
										>
											Selected
										</div>
									{/if}
								</div>
								<div class="mt-1 text-sm text-slate-300">{formatDateLabel(trip.start_time)}</div>
								<div class="text-xs text-slate-500">
									{formatTimeLabel(trip.start_time)} - {formatTimeLabel(trip.end_time)}
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-semibold text-white">{trip.distance_km.toFixed(1)} km</div>
								<div class="text-xs text-slate-500">{trip.max_speed_kmh.toFixed(0)} km/h max</div>
							</div>
						</div>
					</button>

					<div class="mt-3 flex items-center justify-between gap-2">
						<div class="text-xs text-slate-500">
							Avg {trip.avg_moving_speed_kmh.toFixed(1)} km/h
						</div>
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => onTogglePlay(trip)}
								class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
							>
								{isCurrentTrip && isPlaying ? 'Pause' : 'Play'}
							</button>
							<button
								type="button"
								onclick={() => onPreview(trip)}
								class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
							>
								Inspect
							</button>
							{#if multiSelectMode}
								<button
									type="button"
									onclick={() => onToggleRange(trip)}
									class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
								>
									Span
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500"
		>
			No trips are available for the selected asset and filters.
		</div>
	{/if}
</div>
