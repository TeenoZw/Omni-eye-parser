<script lang="ts">
	import SearchBox from '$lib/components/shell/SearchBox.svelte';
	import UserMenuPlaceholder from '$lib/components/shell/UserMenuPlaceholder.svelte';
	import type { DashboardSummary, FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		workspace,
		summary
	}: {
		workspace: FleetWorkspaceData;
		summary: DashboardSummary;
	} = $props();

	const pills = [
		{ label: 'Assets', value: () => summary.total_assets },
		{ label: 'Moving', value: () => summary.moving },
		{ label: 'Alerts', value: () => summary.active_alerts }
	];
</script>

<header class="border-b border-white/8 bg-[#091423]/95 backdrop-blur">
	<div class="flex flex-col gap-3 px-4 py-3 lg:px-6">
		<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
			<div class="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
				<div class="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
					{workspace.hub.name}
				</div>
				<div class="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
					Workspace {workspace.hub.id}
				</div>
				<div class="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
					{workspace.hub.subscription_tier} tier
				</div>
				<div class="hidden rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 md:block">
					Omni Eye platform shell
				</div>
			</div>

			<div class="flex flex-col gap-3 md:flex-row md:items-center">
				<SearchBox />
				<div class="flex items-center gap-2">
					{#each pills as pill}
						<div class="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
							<div class="text-slate-500">{pill.label}</div>
							<div class="mt-0.5 font-semibold text-white">{pill.value()}</div>
						</div>
					{/each}
				</div>
				<UserMenuPlaceholder />
			</div>
		</div>
	</div>
</header>
