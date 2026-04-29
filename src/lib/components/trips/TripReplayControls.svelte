<script lang="ts">
	import { formatDuration, formatSpeed } from '$lib/utils/telemetry/format';

	let {
		currentSpeed,
		currentTime,
		tripDuration,
		progressPercentage,
		seekPosition,
		playbackSpeed,
		isPlaying,
		followPlayback,
		snapToRoads,
		onReset,
		onPlayPause,
		onSeek,
		onSpeedChange
	}: {
		currentSpeed: number;
		currentTime: number;
		tripDuration: number;
		progressPercentage: number;
		seekPosition: number;
		playbackSpeed: number;
		isPlaying: boolean;
		followPlayback: boolean;
		snapToRoads: boolean;
		onReset: () => void;
		onPlayPause: () => void;
		onSeek: (value: number) => void;
		onSpeedChange: (value: number) => void;
	} = $props();
</script>

<div class="pointer-events-none absolute inset-x-4 bottom-4">
	<div
		class="pointer-events-auto rounded-[1.5rem] border border-white/10 bg-slate-950/88 px-4 py-3 backdrop-blur"
	>
		<div class="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
			<div class="flex flex-wrap items-center gap-2">
				<span class="rounded-full bg-cyan-400/10 px-2.5 py-1 font-medium text-cyan-200">
					{formatSpeed(currentSpeed)} km/h
				</span>
				<span class="rounded-full bg-white/5 px-2.5 py-1 text-slate-300">
					Follow {followPlayback ? 'On' : 'Off'}
				</span>
				<span class="rounded-full bg-white/5 px-2.5 py-1 text-slate-300">
					Snap {snapToRoads ? 'On' : 'Off'}
				</span>
			</div>
			<div class="flex items-center gap-4">
				<div>{formatDuration(currentTime)} elapsed</div>
				<div>{formatDuration(tripDuration)} total</div>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button
				type="button"
				onclick={onReset}
				class="rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
			>
				Reset
			</button>
			<button
				type="button"
				onclick={onPlayPause}
				class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
			>
				{isPlaying ? 'Pause' : 'Play'}
			</button>
			<div class="min-w-[180px] flex-1">
				<input
					type="range"
					min="0"
					max="100"
					step="0.1"
					value={seekPosition}
					oninput={(event) => onSeek(parseFloat((event.currentTarget as HTMLInputElement).value))}
					class="slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
				/>
			</div>
			<select
				value={playbackSpeed}
				onchange={(event) =>
					onSpeedChange(parseFloat((event.currentTarget as HTMLSelectElement).value))}
				class="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
			>
				{#each [0.25, 0.5, 1, 1.5, 2, 4, 8, 16, 32] as speed}
					<option value={speed}>{speed}x</option>
				{/each}
			</select>
		</div>

		<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
			<div
				class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 transition-all duration-200"
				style={`width:${progressPercentage}%`}
			></div>
		</div>
	</div>
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 18px;
		width: 18px;
		border-radius: 9999px;
		background: #4dd6ff;
		border: 2px solid rgba(255, 255, 255, 0.95);
		box-shadow: 0 0 0 4px rgba(77, 214, 255, 0.18);
	}

	.slider::-moz-range-thumb {
		height: 18px;
		width: 18px;
		border-radius: 9999px;
		background: #4dd6ff;
		border: 2px solid rgba(255, 255, 255, 0.95);
		box-shadow: 0 0 0 4px rgba(77, 214, 255, 0.18);
	}
</style>
