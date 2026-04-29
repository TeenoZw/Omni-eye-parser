<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { FleetSummary, HubSummary, WorkspaceMode } from '$lib/types/telemetry';

	let {
		hub,
		summary,
		mode,
		onModeChange,
		left,
		center,
		right
	}: {
		hub: HubSummary;
		summary: FleetSummary;
		mode: WorkspaceMode;
		onModeChange: (mode: WorkspaceMode) => void;
		left?: Snippet;
		center?: Snippet;
		right?: Snippet;
	} = $props();

	const summaryCards = [
		{ label: 'Total assets', value: () => summary.total_assets },
		{ label: 'Moving', value: () => summary.moving },
		{ label: 'Idle', value: () => summary.idle },
		{ label: 'Parked', value: () => summary.parked },
		{ label: 'Offline', value: () => summary.offline },
		{ label: 'Active alerts', value: () => summary.active_alerts }
	];
</script>

<div class="min-h-screen bg-[#06101b] text-slate-100">
	<header class="border-b border-white/8 bg-[#091423]/95 backdrop-blur">
		<div class="mx-auto max-w-[1700px] px-4 py-3 lg:px-8">
			<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
				<div class="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
					<div
						class="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-cyan-300 uppercase"
					>
						Omni Eye
					</div>
					<div class="text-sm font-medium text-white">{hub.name}</div>
					<div class="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
						{hub.subscription_tier}
					</div>
					<div
						class="hidden rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 md:block"
					>
						Fleet operations workspace
					</div>
				</div>

				<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
					<div
						class="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-400"
					>
						Search asset, reg, driver, IMEI
					</div>
					<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-1">
						<div class="grid grid-cols-2 gap-1">
							<button
								type="button"
								onclick={() => onModeChange('live')}
								class={`rounded-xl px-4 py-2 text-sm font-medium transition ${
									mode === 'live'
										? 'bg-cyan-400 text-slate-950'
										: 'text-slate-300 hover:bg-white/5 hover:text-white'
								}`}
							>
								Live
							</button>
							<button
								type="button"
								onclick={() => onModeChange('replay')}
								class={`rounded-xl px-4 py-2 text-sm font-medium transition ${
									mode === 'replay'
										? 'bg-cyan-400 text-slate-950'
										: 'text-slate-300 hover:bg-white/5 hover:text-white'
								}`}
							>
								Replay
							</button>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
				{#each summaryCards as card}
					<div class="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
						<div class="text-[11px] tracking-[0.16em] text-slate-500 uppercase">{card.label}</div>
						<div class="mt-1 text-xl font-semibold text-white">{card.value()}</div>
					</div>
				{/each}
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-[1700px] px-4 py-4 lg:px-8">
		<div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
			<div class="min-h-0">{@render left?.()}</div>
			<div class="min-h-0">{@render center?.()}</div>
			<div class="min-h-0">{@render right?.()}</div>
		</div>
	</main>
</div>
