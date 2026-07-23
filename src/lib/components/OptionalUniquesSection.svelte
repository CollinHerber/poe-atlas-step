<script lang="ts">
	import {
		ArrowUpRightFromSquareOutline,
		PlusOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { buildTradeUrl, buildWikiUrl, uniquePriceKey } from '$lib/poe/items';
	import {
		findUniqueTier,
		uniqueTierClass,
		uniqueTierLabel,
		uniqueTierRarity
	} from '$lib/poe/unique-tiers';
	import type {
		BuildGuide,
		GuideOptionalUnique,
		PoeNinjaPriceSnapshot,
		PoeNinjaUniqueCategory,
		PoeNinjaUniquePrice,
		UniqueTierEntry,
		UniqueTierSnapshot
	} from '$lib/types/guide';

	const slots = [
		'Weapon',
		'Helmet',
		'Body Armour',
		'Gloves',
		'Boots',
		'Shield',
		'Amulet',
		'Ring',
		'Belt',
		'Flask',
		'Jewel',
		'Quiver'
	];

	let {
		guide,
		items,
		activeStepId,
		snapshot,
		status,
		tierSnapshot,
		onSelectStep,
		onAdd,
		onUpdate,
		onDelete
	}: {
		guide: BuildGuide;
		items: GuideOptionalUnique[];
		activeStepId: string;
		snapshot: PoeNinjaPriceSnapshot | null;
		status: 'loading' | 'ready' | 'unavailable';
		tierSnapshot: UniqueTierSnapshot | null;
		onSelectStep: (stepId: string) => void;
		onAdd: (item: GuideOptionalUnique) => void;
		onUpdate: (itemId: string, updates: Pick<GuideOptionalUnique, 'stepId' | 'note'>) => void;
		onDelete: (itemId: string) => void;
	} = $props();

	let name = $state('');
	let baseType = $state('');
	let slot = $state('Weapon');
	let stepId = $state('');
	let note = $state('');

	const tierEntries = $derived(
		Object.values(tierSnapshot?.tiers ?? {}).sort(
			(left, right) =>
				left.name.localeCompare(right.name) || left.baseType.localeCompare(right.baseType)
		)
	);
	const league = $derived(snapshot?.league ?? 'Standard');
	const selectedStepId = $derived(
		guide.steps.some((step) => step.id === stepId)
			? stepId
			: guide.steps.some((step) => step.id === activeStepId)
				? activeStepId
				: guide.steps[0]?.id
	);

	$effect(() => {
		if (!guide.steps.some((step) => step.id === stepId)) {
			stepId = guide.steps.some((step) => step.id === activeStepId)
				? activeStepId
				: (guide.steps[0]?.id ?? '');
		}
	});

	function categoryForSlot(itemSlot: string): PoeNinjaUniqueCategory {
		if (itemSlot === 'Flask') return 'UniqueFlask';
		if (itemSlot === 'Jewel') return 'UniqueJewel';
		if (['Amulet', 'Ring', 'Belt', 'Quiver'].includes(itemSlot)) return 'UniqueAccessory';
		if (['Helmet', 'Body Armour', 'Gloves', 'Boots', 'Shield'].includes(itemSlot)) {
			return 'UniqueArmour';
		}
		return 'UniqueWeapon';
	}

	function slotForTier(entry: UniqueTierEntry) {
		const normalized = entry.category.toLocaleLowerCase('en-US');
		if (normalized.includes('flask')) return 'Flask';
		if (normalized.includes('jewel')) return 'Jewel';
		if (normalized.includes('amulet')) return 'Amulet';
		if (normalized.includes('ring')) return 'Ring';
		if (normalized.includes('belt')) return 'Belt';
		if (normalized.includes('quiver')) return 'Quiver';
		if (normalized.includes('helmet')) return 'Helmet';
		if (normalized.includes('body') || normalized.includes('armour')) return 'Body Armour';
		if (normalized.includes('glove')) return 'Gloves';
		if (normalized.includes('boot')) return 'Boots';
		if (normalized.includes('shield')) return 'Shield';
		return 'Weapon';
	}

	function autofillFromCatalog() {
		const normalizedName = name.trim().toLocaleLowerCase('en-US');
		const match = tierEntries.find(
			(entry) => entry.name.toLocaleLowerCase('en-US') === normalizedName
		);
		if (!match) return;
		name = match.name;
		baseType = match.baseType;
		slot = slotForTier(match);
	}

	function addOptionalUnique(event: SubmitEvent) {
		event.preventDefault();
		const trimmedName = name.trim();
		const trimmedBaseType = baseType.trim();
		if (!trimmedName || !trimmedBaseType || !selectedStepId) return;

		const id =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? `optional-unique-${crypto.randomUUID()}`
				: `optional-unique-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

		onAdd({
			id,
			name: trimmedName,
			baseType: trimmedBaseType,
			slot,
			category: categoryForSlot(slot),
			stepId: selectedStepId,
			...(note.trim() ? { note: note.trim() } : {})
		});

		name = '';
		baseType = '';
		note = '';
	}

	function formatNumber(value: number) {
		return new Intl.NumberFormat('en-US', {
			maximumFractionDigits: value < 10 ? 1 : 0
		}).format(value);
	}

	function formatPrice(price: PoeNinjaUniquePrice) {
		if (price.divineValue >= 1) return `~${formatNumber(price.divineValue)} div`;
		return `~${formatNumber(price.chaosValue)} chaos`;
	}

	function updateStep(item: GuideOptionalUnique, event: Event) {
		const nextStepId = (event.currentTarget as HTMLSelectElement).value;
		onUpdate(item.id, { stepId: nextStepId, note: item.note });
	}

	function updateNote(item: GuideOptionalUnique, event: Event) {
		const nextNote = (event.currentTarget as HTMLTextAreaElement).value.trim();
		onUpdate(item.id, { stepId: item.stepId, note: nextNote || undefined });
	}
</script>

<section class="border-t border-slate-800 bg-slate-950/15">
	<header class="grid gap-3 border-b border-slate-800 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto]">
		<div>
			<p class="text-[0.65rem] font-semibold tracking-[0.18em] text-amber-300 uppercase">
				Alternatives
			</p>
			<h2 class="mt-1 text-xl font-bold text-white">Optional uniques</h2>
			<p class="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
				Track temporary, situational, or budget alternatives without treating them as required PoB
				gear. Assign each item to the step where it becomes useful.
			</p>
		</div>
		<div
			class="self-start rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1 text-xs font-bold text-amber-200"
		>
			{items.length} optional
		</div>
	</header>

	<form onsubmit={addOptionalUnique} class="border-b border-slate-800 bg-slate-950/25 p-5 sm:p-6">
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
				Unique name
				<input
					bind:value={name}
					onchange={autofillFromCatalog}
					list="optional-unique-catalog"
					required
					maxlength="300"
					placeholder="e.g. The Pandemonius"
					class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 placeholder:text-slate-600 focus:border-amber-300 focus:ring-1 focus:ring-amber-300 focus:outline-none"
				/>
				<datalist id="optional-unique-catalog">
					{#each tierEntries as entry (`${entry.name}|${entry.baseType}`)}
						<option value={entry.name}>{entry.baseType}</option>
					{/each}
				</datalist>
			</label>

			<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
				Base type
				<input
					bind:value={baseType}
					required
					maxlength="300"
					placeholder="e.g. Jade Amulet"
					class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 placeholder:text-slate-600 focus:border-amber-300 focus:ring-1 focus:ring-amber-300 focus:outline-none"
				/>
			</label>

			<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
				Equipment slot
				<select
					bind:value={slot}
					class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 focus:border-amber-300 focus:ring-1 focus:ring-amber-300 focus:outline-none"
				>
					{#each slots as slotOption (slotOption)}
						<option value={slotOption}>{slotOption}</option>
					{/each}
				</select>
			</label>

			<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
				Applies at step
				<select
					bind:value={stepId}
					class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 focus:border-amber-300 focus:ring-1 focus:ring-amber-300 focus:outline-none"
				>
					{#each guide.steps as step, index (step.id)}
						<option value={step.id}>{index + 1}. {step.title}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
			<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
				Why use it? <span class="font-normal text-slate-600">(optional)</span>
				<input
					bind:value={note}
					maxlength="2000"
					placeholder="Budget alternative until the required item is affordable."
					class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 placeholder:text-slate-600 focus:border-amber-300 focus:ring-1 focus:ring-amber-300 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				class="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
			>
				<PlusOutline class="size-4" /> Add optional unique
			</button>
		</div>
	</form>

	{#if items.length}
		<div class="divide-y divide-slate-800">
			{#each items as item (item.id)}
				{@const price = snapshot?.prices[uniquePriceKey(item.name, item.baseType)]}
				{@const tier = findUniqueTier(tierSnapshot, item)}
				{@const assignedStepIndex = guide.steps.findIndex((step) => step.id === item.stepId)}
				{@const assignedStep = guide.steps[Math.max(assignedStepIndex, 0)]}
				<article
					class="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,0.7fr)_auto] xl:items-center"
				>
					<div class="flex min-w-0 gap-4">
						<div
							class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-amber-300/20 bg-amber-300/5"
						>
							{#if price?.icon}
								<img
									src={price.icon}
									alt=""
									class="size-full object-contain p-1"
									loading="lazy"
									referrerpolicy="no-referrer"
								/>
							{:else}
								<span class="text-xl font-bold text-amber-200/70">{item.name.slice(0, 1)}</span>
							{/if}
						</div>
						<div class="min-w-0">
							<p class="text-[0.65rem] font-semibold tracking-[0.16em] text-slate-600 uppercase">
								{item.slot} · Optional
							</p>
							<h3 class="mt-1 truncate text-base font-semibold text-amber-200" title={item.name}>
								{item.name}
							</h3>
							<p class="truncate text-xs text-slate-500">{item.baseType}</p>
							<div class="mt-2 flex flex-wrap items-center gap-2">
								{#if tier}
									<span
										class={`inline-flex items-center rounded-full border px-2 py-1 text-[0.65rem] font-bold ${uniqueTierClass(tier.tier)}`}
									>
										{uniqueTierLabel(tier.tier)} · {uniqueTierRarity(tier.tier)}
									</span>
								{:else}
									<span class="text-[0.65rem] font-semibold text-slate-700">Tier unknown</span>
								{/if}
								{#if price}
									<span class="text-sm font-bold text-cyan-300">{formatPrice(price)}</span>
									<span class="text-[0.65rem] text-slate-600">
										{price.listingCount.toLocaleString()} listings
									</span>
								{:else if status === 'loading'}
									<span class="h-5 w-24 animate-pulse rounded bg-slate-800"></span>
								{:else}
									<span class="text-xs text-slate-600">No poe.ninja price found</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="grid gap-3">
						<label class="grid gap-1.5 text-xs font-semibold text-slate-500">
							Assigned progression step
							<select
								value={item.stepId}
								onchange={(event) => updateStep(item, event)}
								class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 focus:border-amber-300 focus:ring-1 focus:ring-amber-300 focus:outline-none"
							>
								{#each guide.steps as step, index (step.id)}
									<option value={step.id}>{index + 1}. {step.title}</option>
								{/each}
							</select>
						</label>
						<label class="grid gap-1.5 text-xs font-semibold text-slate-500">
							Alternative note
							<textarea
								value={item.note ?? ''}
								onchange={(event) => updateNote(item, event)}
								maxlength="2000"
								rows="2"
								placeholder="Explain when or why to use this option."
								class="resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-300 placeholder:text-slate-700 focus:border-amber-300 focus:ring-1 focus:ring-amber-300 focus:outline-none"
							></textarea>
						</label>
						{#if assignedStep}
							<button
								type="button"
								onclick={() => onSelectStep(assignedStep.id)}
								class="justify-self-start text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
							>
								Open step {assignedStepIndex + 1}: {assignedStep.title}
							</button>
						{/if}
					</div>

					<!-- External URLs intentionally bypass SvelteKit's internal route resolver. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<div class="flex flex-wrap gap-2 xl:justify-end">
						<a
							href={buildWikiUrl(item)}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-300/40 hover:text-amber-200"
						>
							Wiki <ArrowUpRightFromSquareOutline class="size-3.5" />
						</a>
						<a
							href={buildTradeUrl(item, league)}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
						>
							Trade search <ArrowUpRightFromSquareOutline class="size-3.5" />
						</a>
						<button
							type="button"
							onclick={() => onDelete(item.id)}
							class="grid size-9 place-items-center rounded-lg border border-rose-400/20 bg-rose-400/5 text-rose-300 transition hover:border-rose-300/40 hover:bg-rose-400/10"
							aria-label={`Remove optional unique ${item.name}`}
							title="Remove optional unique"
						>
							<TrashBinOutline class="size-4" />
						</button>
					</div>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</article>
			{/each}
		</div>
	{:else}
		<div class="px-6 py-10 text-center">
			<p class="text-sm font-semibold text-slate-400">No alternatives tracked yet.</p>
			<p class="mt-1 text-xs text-slate-600">
				Add an optional unique above and assign it to the progression step where you would use it.
			</p>
		</div>
	{/if}
</section>
