<script lang="ts">
	import { diffEquipment } from '$lib/poe/equipment';
	import { diffGemGroups } from '$lib/poe/gems';
	import type {
		GuideEquipmentItem,
		GuideGem,
		GuideGemGroup,
		GuideTodo,
		GuideUnique
	} from '$lib/types/guide';

	let {
		stepTitle,
		previousStepTitle,
		prerequisites,
		currentItems,
		previousItems,
		currentUniques,
		previousUniques,
		currentGemGroups,
		previousGemGroups
	}: {
		stepTitle: string;
		previousStepTitle?: string;
		prerequisites: GuideTodo[];
		currentItems: GuideEquipmentItem[];
		previousItems: GuideEquipmentItem[] | null;
		currentUniques: GuideUnique[];
		previousUniques: GuideUnique[] | null;
		currentGemGroups: GuideGemGroup[];
		previousGemGroups: GuideGemGroup[] | null;
	} = $props();

	let equipmentChanges = $derived(diffEquipment(previousItems ?? [], currentItems));
	let gemChanges = $derived(diffGemGroups(previousGemGroups ?? [], currentGemGroups));
	let visiblePrerequisites = $derived(prerequisites.slice(0, 6));
	let hiddenPrerequisiteCount = $derived(
		Math.max(prerequisites.length - visiblePrerequisites.length, 0)
	);
	let newUniqueNames = $derived.by(() => {
		const previousNames = new Set((previousUniques ?? []).map((item) => item.name));
		return [...new Set(currentUniques.map((item) => item.name))].filter(
			(name) => !previousNames.has(name)
		);
	});
	let otherGearTargets = $derived.by(() => {
		if (previousItems === null) return [];
		const newUniqueSet = new Set(newUniqueNames);
		return equipmentChanges.flatMap((change) => {
			if (!change.after) return [];
			if (change.after.rarity === 'UNIQUE' && newUniqueSet.has(change.after.name)) return [];
			return [
				{
					slot: change.slot,
					name: displayItemName(change.after),
					kind: change.kind
				}
			];
		});
	});
	let mainSkillGroup = $derived(
		currentGemGroups.find((group) => group.gems.some((gem) => gem.name === 'Winter Orb'))
	);

	function displayItemName(item: GuideEquipmentItem) {
		return item.name === 'New Item' ? item.baseType : item.name;
	}

	function gemLabel(gem: GuideGem) {
		const details: string[] = [];
		if (gem.level > 0) details.push(`Lvl ${gem.level}`);
		if (gem.quality > 0) details.push(`Q${gem.quality}`);
		return details.length ? `${gem.name} · ${details.join(' · ')}` : gem.name;
	}
</script>

<section
	class="overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-400/5 shadow-xl shadow-black/10"
>
	<header class="border-b border-cyan-400/15 px-5 py-4 sm:px-6">
		<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
			Swap overview
		</p>
		<h3 class="mt-1 text-lg font-semibold text-white">
			{previousStepTitle
				? `Prepare the ${stepTitle} transition`
				: `Establish the ${stepTitle} baseline`}
		</h3>
		<p class="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
			{previousStepTitle
				? `Everything to confirm from ${previousStepTitle}, acquire, and socket before committing to this checkpoint.`
				: 'The starting requirements, main Winter Orb links, and equipment baseline for this progression.'}
		</p>
	</header>

	<div class="grid gap-px bg-cyan-400/10 xl:grid-cols-3">
		<article class="bg-slate-900/95 p-5 sm:p-6">
			<p class="text-[0.65rem] font-semibold tracking-[0.16em] text-emerald-400 uppercase">
				{previousStepTitle ? 'Before this swap' : 'Start here'}
			</p>
			{#if visiblePrerequisites.length}
				<ul class="mt-3 space-y-2.5">
					{#each visiblePrerequisites as item (item.id)}
						<li class="flex gap-2.5 text-xs leading-5 text-slate-300">
							<span
								class={[
									'mt-1.5 size-2 shrink-0 rounded-full',
									item.done ? 'bg-emerald-400' : 'bg-slate-600'
								]}
							></span>
							<span class={item.done ? 'text-slate-500 line-through' : ''}>{item.text}</span>
						</li>
					{/each}
				</ul>
				{#if hiddenPrerequisiteCount}
					<p class="mt-3 text-[0.7rem] font-semibold text-slate-500">
						+{hiddenPrerequisiteCount} more in the detailed checklist
					</p>
				{/if}
			{:else}
				<p class="mt-3 text-sm leading-6 text-slate-500">
					No additional readiness checks are recorded for this checkpoint.
				</p>
			{/if}
		</article>

		<article class="bg-slate-900/95 p-5 sm:p-6">
			<p class="text-[0.65rem] font-semibold tracking-[0.16em] text-amber-300 uppercase">
				Gear to prepare
			</p>
			{#if previousItems === null}
				<p class="mt-2 text-xs leading-5 text-slate-400">
					Establish all {currentItems.length} equipped slots shown in the baseline equipment section.
				</p>
			{/if}
			{#if newUniqueNames.length}
				<p class="mt-3 text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">
					New required uniques
				</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each newUniqueNames as name (name)}
						<span
							class="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[0.7rem] font-medium text-amber-200"
						>
							{name}
						</span>
					{/each}
				</div>
			{/if}
			{#if otherGearTargets.length}
				<p class="mt-4 text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">
					Other equipment changes
				</p>
				<div class="mt-2 grid gap-2">
					{#each otherGearTargets as target (`${target.slot}-${target.name}`)}
						<div class="rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2">
							<p class="text-[0.6rem] font-semibold tracking-wider text-slate-600 uppercase">
								{target.slot} · {target.kind === 'updated' ? 'upgrade rolls' : 'change item'}
							</p>
							<p class="mt-0.5 text-xs font-medium text-slate-300">{target.name}</p>
						</div>
					{/each}
				</div>
			{:else if !newUniqueNames.length && previousItems !== null}
				<p class="mt-3 text-sm leading-6 text-emerald-300">
					No equipment changes from {previousStepTitle}.
				</p>
			{/if}
		</article>

		<article class="bg-slate-900/95 p-5 sm:p-6">
			<p class="text-[0.65rem] font-semibold tracking-[0.16em] text-violet-300 uppercase">
				Gem swaps
			</p>
			{#if previousGemGroups === null}
				{#if mainSkillGroup}
					<p class="mt-3 text-xs font-semibold text-slate-300">
						{mainSkillGroup.slot}{mainSkillGroup.label ? ` · ${mainSkillGroup.label}` : ''}
					</p>
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each mainSkillGroup.gems as gem, gemIndex (`${gem.id}-${gemIndex}`)}
							<span
								class="rounded-md border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[0.7rem] font-medium text-violet-200"
							>
								{gemLabel(gem)}
							</span>
						{/each}
					</div>
					<p class="mt-3 text-[0.7rem] text-slate-500">
						{currentGemGroups.length - 1} additional socket groups complete the starting setup.
					</p>
				{:else}
					<p class="mt-3 text-sm leading-6 text-slate-500">
						Use the complete starting gem setup shown below.
					</p>
				{/if}
			{:else if gemChanges.length}
				<div class="mt-3 space-y-3">
					{#each gemChanges as change (change.key)}
						<div class="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
							<p class="text-xs font-semibold text-slate-300">
								{change.slot}{change.label ? ` · ${change.label}` : ''}
							</p>
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each change.added as gem, gemIndex (`added-${gem.id}-${gemIndex}`)}
									<span class="text-[0.7rem] font-medium text-emerald-300">+ {gem.name}</span>
								{/each}
								{#each change.removed as gem, gemIndex (`removed-${gem.id}-${gemIndex}`)}
									<span class="text-[0.7rem] font-medium text-rose-300">− {gem.name}</span>
								{/each}
								{#each change.updated as update, updateIndex (`updated-${update.after.id}-${updateIndex}`)}
									<span class="text-[0.7rem] font-medium text-amber-200">
										{update.after.name} updated
									</span>
								{/each}
								{#if change.enabledBefore !== change.enabledAfter}
									<span class="text-[0.7rem] font-medium text-cyan-300">
										Group {change.enabledAfter ? 'enabled' : 'disabled'}
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="mt-3 text-sm leading-6 text-emerald-300">
					No gem changes from {previousStepTitle}.
				</p>
			{/if}
		</article>
	</div>
</section>
