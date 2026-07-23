<script lang="ts">
	import {
		ArrowRightOutline,
		ArrowUpRightFromSquareOutline,
		LinkOutline,
		RefreshOutline
	} from 'flowbite-svelte-icons';
	import {
		compareCharacterStats,
		compareConfiguration,
		formatCharacterStat,
		formatConfigurationValue
	} from '$lib/poe/compare';
	import { diffEquipment } from '$lib/poe/equipment';
	import { displayGemColor, type GemDisplayColor } from '$lib/poe/gem-colors';
	import { diffGemGroups } from '$lib/poe/gems';
	import { importPobbBuild, parsePobbUrl } from '$lib/poe/pobb-import';
	import type { BuildGuide, GuideEquipmentItem, GuideGem, GuideStep } from '$lib/types/guide';

	let {
		guide,
		activeStepId
	}: {
		guide: BuildGuide;
		activeStepId: string;
	} = $props();

	let comparisonUrl = $state('');
	let comparisonGuide = $state<BuildGuide | null>(null);
	let currentSourceGuide = $state<BuildGuide | null>(null);
	let currentSourceUrl = $state('');
	let selectedCurrentStepId = $state('');
	let selectedComparisonStepId = $state('');
	let importing = $state(false);
	let message = $state('');

	const normalizedTitle = (value: string) =>
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/gu, ' ')
			.trim();

	const matchingSourceStep = (
		sourceGuide: BuildGuide | null,
		selectedStep: GuideStep,
		selectedIndex: number
	) =>
		sourceGuide?.steps.find(
			(step) => normalizedTitle(step.title) === normalizedTitle(selectedStep.title)
		) ?? sourceGuide?.steps[selectedIndex];

	const suggestedComparisonStepId = (target: BuildGuide, currentStep: GuideStep) => {
		const titleMatch = target.steps.find(
			(step) => normalizedTitle(step.title) === normalizedTitle(currentStep.title)
		);
		if (titleMatch) return titleMatch.id;
		if (currentStep.level !== undefined) {
			return [...target.steps].sort(
				(left, right) =>
					Math.abs((left.level ?? target.level) - currentStep.level!) -
					Math.abs((right.level ?? target.level) - currentStep.level!)
			)[0].id;
		}
		return target.steps[0].id;
	};

	let selectedCurrentIndex = $derived(
		Math.max(
			guide.steps.findIndex((step) => step.id === selectedCurrentStepId),
			0
		)
	);
	let selectedCurrentStep = $derived(guide.steps[selectedCurrentIndex]);
	let sourceStep = $derived(
		currentSourceUrl === guide.sourceUrl
			? matchingSourceStep(currentSourceGuide, selectedCurrentStep, selectedCurrentIndex)
			: undefined
	);
	let currentStep = $derived<GuideStep>({
		...selectedCurrentStep,
		...(selectedCurrentStep.characterStats?.length
			? { characterStats: selectedCurrentStep.characterStats }
			: sourceStep?.characterStats?.length
				? { characterStats: sourceStep.characterStats }
				: {}),
		...(selectedCurrentStep.configuration?.length
			? { configuration: selectedCurrentStep.configuration }
			: sourceStep?.configuration?.length
				? { configuration: sourceStep.configuration }
				: {})
	});
	let comparisonStep = $derived(
		comparisonGuide?.steps.find((step) => step.id === selectedComparisonStepId) ??
			comparisonGuide?.steps[0]
	);
	let itemDifferences = $derived(
		comparisonStep ? diffEquipment(currentStep.equipment ?? [], comparisonStep.equipment ?? []) : []
	);
	let statDifferences = $derived(
		comparisonStep ? compareCharacterStats(currentStep, comparisonStep) : []
	);
	let configurationDifferences = $derived(
		comparisonStep
			? compareConfiguration(currentStep.configuration, comparisonStep.configuration)
			: []
	);
	let gemDifferences = $derived(
		comparisonStep ? diffGemGroups(currentStep.gems ?? [], comparisonStep.gems ?? []) : []
	);

	$effect(() => {
		if (!guide.steps.some((step) => step.id === selectedCurrentStepId)) {
			selectedCurrentStepId = guide.steps.some((step) => step.id === activeStepId)
				? activeStepId
				: guide.steps[0].id;
		}
	});

	async function importComparison(event: SubmitEvent) {
		event.preventDefault();
		if (importing) return;
		importing = true;
		message = 'Reading both Path of Building snapshots…';

		try {
			const comparisonSource = parsePobbUrl(comparisonUrl);
			const currentSource = parsePobbUrl(guide.sourceUrl);
			const comparisonPromise = importPobbBuild(comparisonUrl);
			const currentPromise =
				comparisonSource?.id === currentSource?.id
					? comparisonPromise
					: importPobbBuild(guide.sourceUrl).catch(() => null);
			const [comparisonResult, currentResult] = await Promise.all([
				comparisonPromise,
				currentPromise
			]);

			comparisonGuide = comparisonResult.guide;
			currentSourceGuide = currentResult?.guide ?? null;
			currentSourceUrl = currentResult?.guide.sourceUrl ?? '';
			selectedComparisonStepId = suggestedComparisonStepId(
				comparisonResult.guide,
				selectedCurrentStep
			);
			comparisonUrl = comparisonResult.guide.sourceUrl;
			message = `Ready to compare ${guide.name} with ${comparisonResult.guide.name}.`;
		} catch (error) {
			message =
				error instanceof Error
					? error.message
					: 'This Path of Building could not be imported for comparison.';
		} finally {
			importing = false;
		}
	}

	function itemLines(item: GuideEquipmentItem | undefined) {
		if (!item) return [];
		return [...(item.implicits ?? []).map((implicit) => implicit.text), ...item.stats].slice(0, 5);
	}

	function gemMeta(gem: GuideGem) {
		const details = [`Lvl ${gem.level}`];
		if (gem.quality) details.push(`Q${gem.quality}`);
		if (!gem.enabled) details.push('disabled');
		return details.join(' · ');
	}

	function gemUpdate(before: GuideGem, after: GuideGem) {
		const changes: string[] = [];
		if (before.level !== after.level) changes.push(`Lvl ${before.level} → ${after.level}`);
		if (before.quality !== after.quality) changes.push(`Q${before.quality} → Q${after.quality}`);
		if (before.enabled !== after.enabled) changes.push(after.enabled ? 'enabled' : 'disabled');
		return changes.join(', ') || 'Gem details changed';
	}

	const gemDotClasses: Record<GemDisplayColor, string> = {
		red: 'bg-red-500 border-red-300/40',
		green: 'bg-emerald-500 border-emerald-300/40',
		blue: 'bg-blue-500 border-blue-300/40',
		unknown: 'bg-slate-600 border-slate-400/40'
	};

	const statusLabel = {
		added: 'Added in imported',
		removed: 'Only in website build',
		replaced: 'Different item',
		updated: 'Different modifiers'
	} as const;
</script>

<div class="space-y-6">
	<section
		class="overflow-hidden rounded-2xl border border-violet-400/20 bg-slate-900/60 shadow-2xl shadow-black/20"
	>
		<div
			class="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)] lg:items-end"
		>
			<div>
				<p class="text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
					Build comparison
				</p>
				<h1 class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
					See exactly what changes between two PoB loadouts.
				</h1>
				<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
					Import another pobb.in build, choose a checkpoint on each side, and review the gear,
					calculated stats, configuration, and gem changes before committing to a swap.
				</p>
			</div>

			<form
				onsubmit={importComparison}
				class="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
			>
				<label
					for="comparison-pob-url"
					class="flex items-center gap-2 text-sm font-semibold text-slate-200"
				>
					<LinkOutline class="size-4 text-violet-300" />
					Comparison pobb.in link
				</label>
				<div class="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
					<input
						id="comparison-pob-url"
						type="url"
						bind:value={comparisonUrl}
						disabled={importing}
						required
						placeholder="https://pobb.in/your-build-id"
						class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
					/>
					<button
						type="submit"
						disabled={importing}
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-300 px-4 py-2.5 text-sm font-bold whitespace-nowrap text-slate-950 transition hover:bg-violet-200 disabled:cursor-wait disabled:opacity-60"
					>
						{#if importing}
							<RefreshOutline class="size-4 animate-spin" /> Comparing…
						{:else}
							Compare build <ArrowRightOutline class="size-4" />
						{/if}
					</button>
				</div>
				{#if message}
					<p class="mt-2 text-xs leading-5 text-slate-500" role="status">{message}</p>
				{/if}
			</form>
		</div>
	</section>

	{#if comparisonGuide && comparisonStep}
		<section class="grid gap-4 xl:grid-cols-2">
			<article class="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p class="text-[0.65rem] font-semibold tracking-[0.18em] text-cyan-400 uppercase">
							Website build
						</p>
						<h2 class="mt-1 text-base font-semibold text-white">{guide.name}</h2>
					</div>
					<!-- External PoB URLs must not use SvelteKit's internal route resolver. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={guide.sourceUrl}
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
					>
						Source PoB <ArrowUpRightFromSquareOutline class="size-3.5" />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
				<label class="mt-4 grid gap-1.5 text-xs font-semibold text-slate-500">
					Loadout to compare
					<select
						bind:value={selectedCurrentStepId}
						class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
					>
						{#each guide.steps as step, index (step.id)}
							<option value={step.id}>
								{index + 1}. {step.title}{step.level ? ` · Level ${step.level}` : ''}
							</option>
						{/each}
					</select>
				</label>
			</article>

			<article class="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p class="text-[0.65rem] font-semibold tracking-[0.18em] text-violet-300 uppercase">
							Imported build
						</p>
						<h2 class="mt-1 text-base font-semibold text-white">{comparisonGuide.name}</h2>
					</div>
					<!-- External PoB URLs must not use SvelteKit's internal route resolver. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={comparisonGuide.sourceUrl}
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition hover:text-violet-200"
					>
						Source PoB <ArrowUpRightFromSquareOutline class="size-3.5" />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
				<label class="mt-4 grid gap-1.5 text-xs font-semibold text-slate-500">
					Loadout to compare
					<select
						bind:value={selectedComparisonStepId}
						class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-slate-100 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
					>
						{#each comparisonGuide.steps as step, index (step.id)}
							<option value={step.id}>
								{index + 1}. {step.title}{step.level ? ` · Level ${step.level}` : ''}
							</option>
						{/each}
					</select>
				</label>
			</article>
		</section>

		<section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Comparison summary">
			{#each [{ label: 'Item differences', value: itemDifferences.length, color: 'text-amber-300' }, { label: 'Stat differences', value: statDifferences.length, color: 'text-cyan-300' }, { label: 'Configuration differences', value: configurationDifferences.length, color: 'text-violet-300' }, { label: 'Gem group differences', value: gemDifferences.length, color: 'text-emerald-300' }] as summary (summary.label)}
				<div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
					<p class="text-xs font-semibold text-slate-500">{summary.label}</p>
					<p class={`mt-1 text-2xl font-bold ${summary.color}`}>{summary.value}</p>
				</div>
			{/each}
		</section>

		<section class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
			<header class="border-b border-slate-800 px-5 py-4 sm:px-6">
				<h2 class="text-base font-semibold text-white">Item differences</h2>
				<p class="mt-1 text-sm text-slate-500">
					Equipment is matched by slot, including item identity, implicits, and explicit modifiers.
				</p>
			</header>
			{#if itemDifferences.length}
				<div class="divide-y divide-slate-800">
					{#each itemDifferences as change (`${change.slot}-${change.kind}`)}
						<article class="p-5 sm:p-6">
							<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
								<h3 class="text-sm font-semibold text-slate-100">{change.slot}</h3>
								<span
									class="rounded-full bg-amber-400/10 px-2.5 py-1 text-[0.65rem] font-semibold text-amber-300"
								>
									{statusLabel[change.kind]}
								</span>
							</div>
							<div class="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
								<div class="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4">
									<p class="text-[0.65rem] font-semibold tracking-wider text-cyan-400 uppercase">
										Website
									</p>
									{#if change.before}
										<p class="mt-2 text-sm font-semibold text-slate-100">{change.before.name}</p>
										<p class="text-xs text-slate-500">{change.before.baseType}</p>
										<ul class="mt-3 space-y-1.5">
											{#each itemLines(change.before) as line (line)}
												<li class="text-xs leading-5 text-slate-400">{line}</li>
											{/each}
										</ul>
									{:else}
										<p class="mt-2 text-sm text-slate-600">Empty slot</p>
									{/if}
								</div>
								<div class="hidden items-center text-slate-700 lg:flex">
									<ArrowRightOutline class="size-4" />
								</div>
								<div class="rounded-xl border border-violet-400/15 bg-violet-400/5 p-4">
									<p class="text-[0.65rem] font-semibold tracking-wider text-violet-300 uppercase">
										Imported
									</p>
									{#if change.after}
										<p class="mt-2 text-sm font-semibold text-slate-100">{change.after.name}</p>
										<p class="text-xs text-slate-500">{change.after.baseType}</p>
										<ul class="mt-3 space-y-1.5">
											{#each itemLines(change.after) as line (line)}
												<li class="text-xs leading-5 text-slate-400">{line}</li>
											{/each}
										</ul>
									{:else}
										<p class="mt-2 text-sm text-slate-600">Empty slot</p>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<p class="px-6 py-8 text-center text-sm text-emerald-300">
					These loadouts use the same equipment in every populated slot.
				</p>
			{/if}
		</section>

		<section class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
			<header class="border-b border-slate-800 px-5 py-4 sm:px-6">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 class="text-base font-semibold text-white">Stat differences</h2>
						<p class="mt-1 text-sm text-slate-500">
							Key offensive, defensive, recovery, movement, and charge values saved by PoB.
						</p>
					</div>
					<div class="flex flex-wrap gap-2 text-[0.65rem] font-semibold">
						<span class={currentStep.characterStats?.length ? 'text-cyan-300' : 'text-slate-600'}>
							Website {currentStep.characterStats?.length
								? 'snapshot captured'
								: 'snapshot unavailable'}
						</span>
						<span
							class={comparisonStep.characterStats?.length ? 'text-violet-300' : 'text-slate-600'}
						>
							Imported {comparisonStep.characterStats?.length
								? 'snapshot captured'
								: 'snapshot unavailable'}
						</span>
					</div>
				</div>
			</header>
			{#if statDifferences.length}
				<div class="overflow-x-auto">
					<table class="w-full min-w-[42rem] text-left">
						<thead class="bg-slate-950/35 text-[0.65rem] tracking-wider text-slate-600 uppercase">
							<tr>
								<th class="px-5 py-3 font-semibold sm:px-6">Stat</th>
								<th class="px-5 py-3 text-right font-semibold">Website</th>
								<th class="px-5 py-3 text-right font-semibold sm:px-6">Imported</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-800">
							{#each statDifferences as difference (difference.name)}
								<tr>
									<td class="px-5 py-3 sm:px-6">
										<p class="text-sm font-medium text-slate-200">{difference.label}</p>
										<p class="mt-0.5 text-[0.65rem] text-slate-700">
											{difference.kind === 'progression'
												? 'Loadout progression'
												: 'Calculated PoB stat'}
										</p>
									</td>
									<td class="px-5 py-3 text-right text-sm font-semibold text-cyan-300">
										{formatCharacterStat(difference.name, difference.current)}
									</td>
									<td class="px-5 py-3 text-right text-sm font-semibold text-violet-300 sm:px-6">
										{formatCharacterStat(difference.name, difference.comparison)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="px-6 py-8 text-center text-sm text-emerald-300">
					No captured key stats differ between these loadouts.
				</p>
			{/if}
			<footer
				class="border-t border-slate-800 bg-slate-950/25 px-5 py-3 text-[0.65rem] leading-5 text-slate-600 sm:px-6"
			>
				Path of Building exports calculated PlayerStat values only for the loadout that was active
				when the file was saved. Level and passive points remain comparable for every loadout.
			</footer>
		</section>

		<section class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
			<header class="border-b border-slate-800 px-5 py-4 sm:px-6">
				<h2 class="text-base font-semibold text-white">PoB configuration differences</h2>
				<p class="mt-1 text-sm text-slate-500">
					Enabled conditions, charges, boss settings, Pantheon choices, multipliers, and custom
					modifiers.
				</p>
			</header>
			{#if configurationDifferences.length}
				<div class="divide-y divide-slate-800">
					{#each configurationDifferences as difference (difference.name)}
						<article
							class="grid gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(12rem,0.7fr)_1fr_1fr] lg:items-start"
						>
							<div>
								<h3 class="text-sm font-semibold text-slate-200">{difference.label}</h3>
								<p class="mt-0.5 text-[0.65rem] text-slate-700">{difference.name}</p>
							</div>
							<div class="rounded-lg border border-cyan-400/10 bg-cyan-400/5 px-3 py-2.5">
								<p class="text-[0.6rem] font-semibold tracking-wider text-cyan-400 uppercase">
									Website
								</p>
								<p class="mt-1 text-xs leading-5 whitespace-pre-wrap text-slate-300">
									{formatConfigurationValue(difference.current)}
								</p>
							</div>
							<div class="rounded-lg border border-violet-400/10 bg-violet-400/5 px-3 py-2.5">
								<p class="text-[0.6rem] font-semibold tracking-wider text-violet-300 uppercase">
									Imported
								</p>
								<p class="mt-1 text-xs leading-5 whitespace-pre-wrap text-slate-300">
									{formatConfigurationValue(difference.comparison)}
								</p>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<p class="px-6 py-8 text-center text-sm text-emerald-300">
					These loadouts use the same explicit PoB configuration inputs.
				</p>
			{/if}
			<footer
				class="border-t border-slate-800 bg-slate-950/25 px-5 py-3 text-[0.65rem] text-slate-600 sm:px-6"
			>
				PoB omits default inputs from its export, so missing booleans and numbers are shown as
				Disabled or 0. Bandit and Pantheon choices are inherited from the build. Derived enemy
				placeholders remain excluded.
			</footer>
		</section>

		<section class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
			<header class="border-b border-slate-800 px-5 py-4 sm:px-6">
				<h2 class="text-base font-semibold text-white">Skill gem differences</h2>
				<p class="mt-1 text-sm text-slate-500">
					Gems are compared inside their socket groups, including level, quality, and enabled state.
				</p>
			</header>
			{#if gemDifferences.length}
				<div class="grid gap-px bg-slate-800 lg:grid-cols-2">
					{#each gemDifferences as change (change.key)}
						<article class="bg-slate-900 p-5">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div>
									<h3 class="text-sm font-semibold text-slate-100">{change.slot}</h3>
									{#if change.label ?? change.previousLabel}
										<p class="mt-0.5 text-xs text-slate-600">
											{change.label ?? change.previousLabel}
										</p>
									{/if}
								</div>
								{#if change.enabledBefore !== undefined && change.enabledAfter !== undefined && change.enabledBefore !== change.enabledAfter}
									<span
										class="rounded-full bg-amber-400/10 px-2 py-1 text-[0.65rem] font-semibold text-amber-300"
									>
										Group {change.enabledAfter ? 'enabled' : 'disabled'}
									</span>
								{/if}
							</div>
							<div class="mt-3 flex flex-wrap gap-2">
								{#each change.added as gem, index (`added-${gem.id}-${index}`)}
									<span
										class="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[0.7rem] font-medium text-emerald-300"
										title={gemMeta(gem)}
									>
										<span class={['size-2 rounded-sm border', gemDotClasses[displayGemColor(gem)]]}
										></span>
										+ {gem.name}
									</span>
								{/each}
								{#each change.removed as gem, index (`removed-${gem.id}-${index}`)}
									<span
										class="inline-flex items-center gap-1.5 rounded-md border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-[0.7rem] font-medium text-rose-300"
										title={gemMeta(gem)}
									>
										<span class={['size-2 rounded-sm border', gemDotClasses[displayGemColor(gem)]]}
										></span>
										− {gem.name}
									</span>
								{/each}
								{#each change.updated as update, index (`updated-${update.after.id}-${index}`)}
									<span
										class="inline-flex items-center gap-1.5 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[0.7rem] font-medium text-amber-200"
									>
										<span
											class={[
												'size-2 rounded-sm border',
												gemDotClasses[displayGemColor(update.after)]
											]}
										></span>
										{update.after.name}: {gemUpdate(update.before, update.after)}
									</span>
								{/each}
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<p class="px-6 py-8 text-center text-sm text-emerald-300">
					These loadouts use the same gem groups and gem settings.
				</p>
			{/if}
		</section>
	{:else}
		<section
			class="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center"
		>
			<p class="text-base font-semibold text-slate-300">Import a build to begin comparing.</p>
			<p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
				Your current website build stays untouched. The imported PoB is held only in this comparison
				workspace.
			</p>
		</section>
	{/if}
</div>
