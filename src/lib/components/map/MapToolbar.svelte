<script lang="ts">
	import type { WorkspaceMode } from '$lib/types/telemetry';

	let {
		mode,
		followPlayback,
		snapToRoads,
		stopCount,
		onRecenter,
		onToggleFollow,
		onToggleSnap
	}: {
		mode: WorkspaceMode;
		followPlayback: boolean;
		snapToRoads: boolean;
		stopCount: number;
		onRecenter: () => void;
		onToggleFollow: () => void;
		onToggleSnap: () => void;
	} = $props();

	let showRouteMenu = $state(false);

	const routeActions = ['Track player', 'Route analysis', 'Stops', 'Address lookup', 'Share route'];
</script>

<div class="pointer-events-none absolute inset-4">
	<div class="pointer-events-auto absolute top-0 left-0">
		<div
			class="rounded-full border border-white/10 bg-slate-950/82 px-3 py-2 text-xs text-slate-300 backdrop-blur"
		>
			<span class="font-medium text-white">{mode === 'live' ? 'Live' : 'Replay'}</span>
			<span class="mx-2 text-slate-600">•</span>
			<span>Stops {stopCount}</span>
			<span class="mx-2 text-slate-600">•</span>
			<span>{followPlayback ? 'Follow on' : 'Follow off'}</span>
		</div>
	</div>

	<div class="pointer-events-auto absolute top-16 left-0">
		<div
			class="flex flex-col gap-2 rounded-[1.25rem] border border-white/10 bg-slate-950/82 p-2 backdrop-blur"
		>
			<button
				type="button"
				title="Recenter map"
				onclick={onRecenter}
				class="grid h-11 w-11 place-items-center rounded-xl bg-white text-sm font-semibold text-slate-950 shadow-xl transition hover:bg-slate-200"
			>
				C
			</button>
			<button
				type="button"
				title="Toggle follow"
				onclick={onToggleFollow}
				class={`grid h-11 w-11 place-items-center rounded-xl border text-xs font-semibold transition ${
					followPlayback
						? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
						: 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
				}`}
			>
				F
			</button>
			<button
				type="button"
				title="Toggle road snap"
				onclick={onToggleSnap}
				class={`grid h-11 w-11 place-items-center rounded-xl border text-xs font-semibold transition ${
					snapToRoads
						? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
						: 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
				}`}
			>
				S
			</button>
			{#if mode === 'replay'}
				<div class="relative">
					<button
						type="button"
						title="Route tools"
						onclick={() => (showRouteMenu = !showRouteMenu)}
						class={`grid h-11 w-11 place-items-center rounded-xl border text-xs font-semibold transition ${
							showRouteMenu
								? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
								: 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
						}`}
					>
						R
					</button>

					{#if showRouteMenu}
						<div
							class="absolute top-0 left-14 w-52 rounded-[1.25rem] border border-white/10 bg-slate-950/94 p-2 shadow-2xl backdrop-blur"
						>
							<div class="px-3 py-2 text-[11px] tracking-[0.18em] text-slate-500 uppercase">
								Route tools
							</div>
							<div class="space-y-1">
								{#each routeActions as action}
									<button
										type="button"
										class="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/6 hover:text-white"
									>
										{action}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
