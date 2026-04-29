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
</script>

<div class="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-4">
	<div
		class="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/82 px-4 py-3 backdrop-blur"
	>
		<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Map status</div>
		<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
			<span class="rounded-full bg-white/5 px-2.5 py-1">Mode: {mode}</span>
			<span class="rounded-full bg-white/5 px-2.5 py-1"
				>Follow: {followPlayback ? 'On' : 'Off'}</span
			>
			<span class="rounded-full bg-white/5 px-2.5 py-1">Snap: {snapToRoads ? 'On' : 'Off'}</span>
			<span class="rounded-full bg-white/5 px-2.5 py-1">Stops: {stopCount}</span>
		</div>
	</div>

	<div class="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
		<button
			type="button"
			onclick={onToggleFollow}
			class="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-sm font-medium text-slate-200 shadow-xl transition hover:border-white/20 hover:text-white"
		>
			{followPlayback ? 'Disable follow' : 'Enable follow'}
		</button>
		<button
			type="button"
			onclick={onToggleSnap}
			class="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-sm font-medium text-slate-200 shadow-xl transition hover:border-white/20 hover:text-white"
		>
			{snapToRoads ? 'Road snap on' : 'Road snap off'}
		</button>
		<button
			type="button"
			onclick={onRecenter}
			class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-xl transition hover:bg-slate-200"
		>
			Recenter asset
		</button>
	</div>
</div>
