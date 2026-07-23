<script lang="ts">
	import type { GuideInsight } from '$lib/types/guide';

	let { insights }: { insights: GuideInsight[] } = $props();
</script>

{#if insights.length}
	<section
		class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 shadow-xl shadow-black/10"
	>
		<header class="border-b border-slate-800 px-5 py-4 sm:px-6">
			<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-amber-300/80 uppercase">
				Checkpoint briefing
			</p>
			<h3 class="mt-1 text-base font-semibold text-slate-100">What to know at this step</h3>
			<p class="mt-1 text-sm leading-6 text-slate-500">
				The mechanics and trade-offs behind the checklist—not just the boxes to tick.
			</p>
		</header>

		<div class="grid gap-px bg-slate-800/80 md:grid-cols-2">
			{#each insights as insight (insight.title)}
				<article class="bg-slate-900/95 px-5 py-5 sm:px-6">
					<h4 class="text-sm font-semibold text-slate-100">{insight.title}</h4>
					<p class="mt-2 text-sm leading-6 text-slate-400">{insight.body}</p>
					<!-- These are researched external references, not internal SvelteKit routes. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={insight.sourceUrl}
						target="_blank"
						rel="noreferrer"
						class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
					>
						{insight.sourceLabel} <span aria-hidden="true">↗</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</article>
			{/each}
		</div>
	</section>
{/if}
