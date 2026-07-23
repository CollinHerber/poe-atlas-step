<script lang="ts">
	let {
		sections,
		onNavigate,
		variant = 'compact'
	}: {
		sections: { id: string; label: string }[];
		onNavigate: (id: string) => void;
		variant?: 'compact' | 'sidebar';
	} = $props();
</script>

{#if variant === 'sidebar'}
	<nav
		aria-label="Table of contents for this step"
		class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
	>
		<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
			Table of contents
		</p>
		<ol class="mt-3 space-y-1">
			{#each sections as section, index (section.id)}
				<li>
					<button
						type="button"
						onclick={() => onNavigate(section.id)}
						class="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs text-slate-400 transition hover:bg-slate-800/70 hover:text-cyan-300"
					>
						<span
							class="grid size-5 shrink-0 place-items-center rounded-md bg-slate-800 text-[0.6rem] font-bold text-slate-600 transition group-hover:bg-cyan-400/10 group-hover:text-cyan-300"
						>
							{index + 1}
						</span>
						{section.label}
					</button>
				</li>
			{/each}
		</ol>
	</nav>
{:else}
	<nav
		aria-label="Table of contents for this step"
		class="rounded-xl border border-slate-800 bg-slate-900/55 p-3 xl:hidden"
	>
		<div class="flex items-center gap-3 overflow-x-auto">
			<p
				class="shrink-0 pl-1 text-[0.65rem] font-semibold tracking-[0.16em] text-cyan-400 uppercase"
			>
				Contents
			</p>
			<div class="flex gap-1.5">
				{#each sections as section (section.id)}
					<button
						type="button"
						onclick={() => onNavigate(section.id)}
						class="shrink-0 rounded-lg border border-slate-800 bg-slate-950/30 px-2.5 py-1.5 text-[0.7rem] font-medium text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
					>
						{section.label}
					</button>
				{/each}
			</div>
		</div>
	</nav>
{/if}
