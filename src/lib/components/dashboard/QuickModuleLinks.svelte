<script lang="ts">
	const links = [
		{
			href: '/monitoring',
			label: 'Monitoring',
			description: 'Open the live tracking map workspace.'
		},
		{
			href: '/playback',
			label: 'Playback',
			description: 'Replay historical trips and stops.'
		},
		{
			href: '/reports',
			label: 'Reports',
			description: 'Review report definitions and outputs.'
		},
		{
			href: '/alerts',
			label: 'Alerts',
			description: 'Work the fleet attention queue.'
		}
	];
</script>

<section class="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
	<div class="text-[11px] tracking-[0.18em] text-slate-500 uppercase">Quick links</div>
	<div class="mt-1 text-lg font-semibold text-white">Jump into a focused module</div>
	<div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
		{#each links as link}
			<a
				href={link.href}
				class="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/6"
			>
				<div class="text-sm font-semibold text-white">{link.label}</div>
				<div class="mt-2 text-sm text-slate-400">{link.description}</div>
			</a>
		{/each}
	</div>
</section>
