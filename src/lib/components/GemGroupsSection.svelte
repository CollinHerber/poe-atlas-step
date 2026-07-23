<script lang="ts">
	import { diffGemGroups } from '$lib/poe/gems';
	import type { GuideGem, GuideGemColor, GuideGemGroup } from '$lib/types/guide';

	let {
		currentGroups,
		previousGroups,
		previousStepTitle
	}: {
		currentGroups: GuideGemGroup[];
		previousGroups: GuideGemGroup[] | null;
		previousStepTitle?: string;
	} = $props();

	let changes = $derived(diffGemGroups(previousGroups ?? [], currentGroups));
	let gemCount = $derived(currentGroups.reduce((total, group) => total + group.gems.length, 0));

	function formatGemMeta(gem: GuideGem) {
		const details = [`Lvl ${gem.level}`];
		if (gem.quality > 0) details.push(`Q${gem.quality}`);
		if (gem.support) details.push('Support');
		if (!gem.enabled) details.push('off');
		return details.join(' · ');
	}

	const gemColorLabels: Record<GuideGemColor, string> = {
		red: 'Strength',
		green: 'Dexterity',
		blue: 'Intelligence'
	};

	const gemCardClasses: Record<GuideGemColor, string> = {
		red: 'border-red-400/30 bg-red-500/10',
		green: 'border-emerald-400/30 bg-emerald-500/10',
		blue: 'border-blue-400/30 bg-blue-500/10'
	};

	const gemTextClasses: Record<GuideGemColor, string> = {
		red: 'text-red-200',
		green: 'text-emerald-200',
		blue: 'text-blue-200'
	};

	const gemDotClasses: Record<GuideGemColor, string> = {
		red: 'border-red-300/40 bg-red-500',
		green: 'border-emerald-300/40 bg-emerald-500',
		blue: 'border-blue-300/40 bg-blue-500'
	};

	const gemColor = (gem: GuideGem): GuideGemColor => gem.color ?? 'blue';

	function changeDetails(before: GuideGem, after: GuideGem) {
		const details: string[] = [];
		if (before.level !== after.level) details.push(`Lvl ${before.level} → ${after.level}`);
		if (before.quality !== after.quality) details.push(`Q${before.quality} → Q${after.quality}`);
		if (before.enabled !== after.enabled) details.push(after.enabled ? 'enabled' : 'disabled');
		if (before.support !== after.support)
			details.push(after.support ? 'now a support' : 'now a skill');
		if (before.color !== after.color) {
			details.push(
				`${gemColorLabels[gemColor(before)]} → ${gemColorLabels[gemColor(after)]} socket`
			);
		}
		if (!details.length && before.name !== after.name) details.push(`renamed from ${before.name}`);
		return details.join(', ');
	}
</script>

<section
	class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 shadow-xl shadow-black/10"
>
	<header
		class="flex flex-col gap-2 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
	>
		<div>
			<h3 class="text-base font-semibold text-slate-100">Skill gems</h3>
			<p class="mt-1 text-sm leading-6 text-slate-500">
				Socket groups and links from this Path of Building checkpoint.
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			{#each Object.entries(gemColorLabels) as [color, label] (color)}
				<span class="inline-flex items-center gap-1.5 text-[0.65rem] font-medium text-slate-500">
					<span
						class={['size-2.5 rounded-sm border shadow-sm', gemDotClasses[color as GuideGemColor]]}
						aria-hidden="true"
					></span>
					{label}
				</span>
			{/each}
			<span class="text-xs text-slate-600">{currentGroups.length} groups · {gemCount} gems</span>
		</div>
	</header>

	<div class="border-b border-slate-800 bg-slate-950/25 px-5 py-4 sm:px-6">
		{#if previousGroups === null}
			<p class="text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">Starting setup</p>
			<p class="mt-1 text-sm text-slate-400">
				This first loadout is your gem baseline. There is no previous checkpoint to compare.
			</p>
		{:else if changes.length === 0}
			<p class="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
				No gem changes
			</p>
			<p class="mt-1 text-sm text-slate-400">
				This setup matches {previousStepTitle ?? 'the previous checkpoint'}.
			</p>
		{:else}
			<p class="text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
				Changes from {previousStepTitle ?? 'the previous checkpoint'}
			</p>
			<div class="mt-3 grid gap-3 xl:grid-cols-2">
				{#each changes as change (change.key)}
					<article class="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
						<div class="flex flex-wrap items-center gap-2">
							<h4 class="text-xs font-semibold text-slate-200">{change.slot}</h4>
							{#if change.label ?? change.previousLabel}
								<span class="text-[0.65rem] text-slate-500">
									{change.label ?? change.previousLabel}
								</span>
							{/if}
							{#if change.enabledBefore !== undefined && change.enabledAfter !== undefined && change.enabledBefore !== change.enabledAfter}
								<span
									class="rounded-full bg-amber-400/10 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-300"
								>
									Group {change.enabledAfter ? 'enabled' : 'disabled'}
								</span>
							{/if}
						</div>
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each change.added as gem, gemIndex (`added-${gem.id}-${gemIndex}`)}
								<span
									class="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[0.7rem] font-medium text-emerald-300"
									title={formatGemMeta(gem)}
								>
									<span
										class={['size-2 rounded-sm border', gemDotClasses[gemColor(gem)]]}
										aria-hidden="true"
									></span>
									+ {gem.name}
								</span>
							{/each}
							{#each change.removed as gem, gemIndex (`removed-${gem.id}-${gemIndex}`)}
								<span
									class="inline-flex items-center gap-1.5 rounded-md border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-[0.7rem] font-medium text-rose-300 line-through decoration-rose-300/50"
									title={formatGemMeta(gem)}
								>
									<span
										class={['size-2 rounded-sm border', gemDotClasses[gemColor(gem)]]}
										aria-hidden="true"
									></span>
									− {gem.name}
								</span>
							{/each}
							{#each change.updated as update, updateIndex (`updated-${update.after.id}-${updateIndex}`)}
								<span
									class="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[0.7rem] font-medium text-amber-200"
								>
									{update.after.name}: {changeDetails(update.before, update.after)}
								</span>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>

	{#if currentGroups.length}
		<div class="grid gap-px bg-slate-800/80 xl:grid-cols-2">
			{#each currentGroups as group, groupIndex (`${group.slot}-${groupIndex}`)}
				<article class="bg-slate-900/95 p-5 sm:p-6">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<p class="text-[0.65rem] font-semibold tracking-[0.18em] text-slate-600 uppercase">
								{group.slot}
							</p>
							{#if group.label}
								<h4 class="mt-1 text-sm font-semibold text-slate-200">{group.label}</h4>
							{/if}
						</div>
						{#if !group.enabled}
							<span
								class="rounded-full bg-slate-800 px-2 py-1 text-[0.65rem] font-semibold text-slate-500"
							>
								Group disabled
							</span>
						{/if}
					</div>

					<div class="mt-3 flex flex-wrap items-center gap-2">
						{#each group.gems as gem, gemIndex (`${gem.id}-${gemIndex}`)}
							<div
								class={[
									'rounded-lg border px-2.5 py-2',
									gemCardClasses[gemColor(gem)],
									gem.enabled && group.enabled ? '' : 'opacity-45'
								]}
								title={`${gemColorLabels[gemColor(gem)]} gem`}
							>
								<p class={['text-xs font-semibold', gemTextClasses[gemColor(gem)]]}>
									{gem.name}
								</p>
								<p class="mt-0.5 text-[0.65rem] text-slate-600">{formatGemMeta(gem)}</p>
							</div>
							{#if gemIndex < group.gems.length - 1}
								<span class="text-xs font-semibold text-slate-700" aria-hidden="true">—</span>
							{/if}
						{/each}
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="px-6 py-8 text-center">
			<p class="text-sm font-medium text-slate-500">No skill gems found for this checkpoint.</p>
			<p class="mt-1 text-xs text-slate-700">
				Refresh the imported PoB data to populate this setup.
			</p>
		</div>
	{/if}

	<footer
		class="border-t border-slate-800 bg-slate-950/25 px-5 py-3 text-[0.65rem] text-slate-700 sm:px-6"
	>
		Disabled gems are retained because Path of Building often uses them as swap options.
	</footer>
</section>
