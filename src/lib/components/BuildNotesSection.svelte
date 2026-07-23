<script lang="ts">
	import { ArrowUpRightFromSquareOutline, BookOpenOutline } from 'flowbite-svelte-icons';
	import type { GuideNoteSection } from '$lib/types/guide';

	let {
		sections,
		highlights = [],
		sourceUrl
	}: {
		sections: GuideNoteSection[];
		highlights?: string[];
		sourceUrl: string;
	} = $props();
</script>

<section class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/45">
	<div
		class="flex flex-col gap-3 border-b border-slate-800 bg-slate-950/35 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
	>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-violet-400/25 bg-violet-400/10 text-violet-300"
			>
				<BookOpenOutline class="size-4" />
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-violet-300 uppercase">
					Imported reference
				</p>
				<h3 class="mt-1 text-base font-semibold text-white">Path of Building notes</h3>
				<p class="mt-1 text-xs leading-5 text-slate-500">
					The build author's notes, summarized and kept visible at every checkpoint.
				</p>
			</div>
		</div>
		<!-- External PoB URLs must not use SvelteKit's internal route resolver. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={sourceUrl}
			target="_blank"
			rel="noreferrer"
			class="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-violet-400/50 hover:text-violet-300"
		>
			Open original notes <ArrowUpRightFromSquareOutline class="size-3.5" />
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>

	<div class="space-y-6 p-5 sm:p-7">
		{#if highlights.length}
			<div class="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
				<p class="text-xs font-semibold tracking-[0.16em] text-cyan-300 uppercase">
					Relevant for this step
				</p>
				<ul class="mt-3 space-y-2">
					{#each highlights as highlight (highlight)}
						<li class="flex gap-3 text-sm leading-6 text-slate-300">
							<span class="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-400"></span>
							<span>{highlight}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if sections.length}
			<div class="grid gap-x-8 gap-y-6 lg:grid-cols-2">
				{#each sections as section (section.title)}
					<article class="border-l border-slate-700/70 pl-4">
						<h4 class="text-sm font-semibold text-slate-200">{section.title}</h4>
						<p class="mt-2 text-xs leading-6 text-slate-500">{section.body}</p>
					</article>
				{/each}
			</div>
		{:else}
			<p class="text-sm leading-6 text-slate-500">
				This imported build does not include any author notes.
			</p>
		{/if}
	</div>
</section>
