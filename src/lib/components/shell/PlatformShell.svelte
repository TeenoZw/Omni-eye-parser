<script lang="ts">
	import ModuleNav from '$lib/components/shell/ModuleNav.svelte';
	import TopNav from '$lib/components/shell/TopNav.svelte';
	import { SHELL_NAV_ITEMS } from '$lib/stores/workspace';
	import type { DashboardSummary, FleetWorkspaceData } from '$lib/types/telemetry';

	let {
		workspace,
		summary,
		pathname,
		children
	}: {
		workspace: FleetWorkspaceData;
		summary: DashboardSummary;
		pathname: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="min-h-screen bg-[#06101b] text-slate-100">
	<div class="flex min-h-screen">
		<aside class="hidden w-[268px] shrink-0 border-r border-white/8 bg-[#08111d] lg:flex lg:flex-col">
			<div class="border-b border-white/8 px-5 py-5">
				<div
					class="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-cyan-300 uppercase"
				>
					Omni Eye
				</div>
				<div class="mt-3 text-sm font-semibold text-white">Command workspace</div>
				<div class="mt-1 text-xs text-slate-500">
					Monitoring, playback, assets, alerts, analytics, and settings in one modular platform
				</div>
			</div>

			<div class="flex-1 overflow-y-auto px-3 py-4">
				<ModuleNav items={SHELL_NAV_ITEMS} {pathname} />
			</div>

			<div class="border-t border-white/8 px-4 py-4">
				<div class="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
					<div class="text-[11px] tracking-[0.16em] text-slate-500 uppercase">Platform state</div>
					<div class="mt-2 text-sm font-medium text-white">Mock data shell</div>
					<div class="mt-1 text-xs text-slate-500">
						Structured for backend integration later without collapsing modules back into one page.
					</div>
				</div>
			</div>
		</aside>

		<div class="flex min-h-screen min-w-0 flex-1 flex-col">
			<TopNav {workspace} {summary} />
			<div class="border-b border-white/8 bg-[#08111d] px-4 py-3 lg:hidden">
				<ModuleNav items={SHELL_NAV_ITEMS} {pathname} compact />
			</div>
			<main class="min-w-0 flex-1 px-4 py-4 lg:px-6">
				{@render children?.()}
			</main>
		</div>
	</div>
</div>
