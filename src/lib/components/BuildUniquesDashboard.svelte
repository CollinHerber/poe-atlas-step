<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { ArrowUpRightFromSquareOutline, StarOutline } from 'flowbite-svelte-icons';
	import { buildTradeUrl, buildWikiUrl, uniquePriceKey } from '$lib/poe/items';
	import type {
		BuildGuide,
		GuideUnique,
		PoeNinjaPriceSnapshot,
		PoeNinjaUniquePrice
	} from '$lib/types/guide';

	type UniqueAppearance = {
		stepId: string;
		stepTitle: string;
		stepNumber: number;
	};

	type BuildUnique = {
		item: GuideUnique;
		slots: string[];
		appearances: UniqueAppearance[];
	};

	let {
		guide,
		snapshot,
		status,
		onSelectStep
	}: {
		guide: BuildGuide;
		snapshot: PoeNinjaPriceSnapshot | null;
		status: 'loading' | 'ready' | 'unavailable';
		onSelectStep: (stepId: string) => void;
	} = $props();

	function aggregateUniques(currentGuide: BuildGuide): BuildUnique[] {
		const itemsByKey = new SvelteMap<string, BuildUnique>();

		currentGuide.steps.forEach((step, stepIndex) => {
			step.uniques.forEach((item) => {
				const key = uniquePriceKey(item.name, item.baseType);
				const existing = itemsByKey.get(key);
				const appearance = {
					stepId: step.id,
					stepTitle: step.title,
					stepNumber: stepIndex + 1
				};

				if (existing) {
					if (!existing.slots.includes(item.slot)) existing.slots.push(item.slot);
					if (!existing.appearances.some((entry) => entry.stepId === step.id)) {
						existing.appearances.push(appearance);
					}
					return;
				}

				itemsByKey.set(key, {
					item,
					slots: [item.slot],
					appearances: [appearance]
				});
			});
		});

		return [...itemsByKey.values()].sort(
			(left, right) =>
				left.appearances[0].stepNumber - right.appearances[0].stepNumber ||
				left.item.name.localeCompare(right.item.name)
		);
	}

	const uniqueItems = $derived(aggregateUniques(guide));
	const pricedCount = $derived(
		uniqueItems.filter(({ item }) => snapshot?.prices[uniquePriceKey(item.name, item.baseType)])
			.length
	);
	const league = $derived(snapshot?.league ?? 'Standard');

	function getPrice(item: GuideUnique): PoeNinjaUniquePrice | undefined {
		return snapshot?.prices[uniquePriceKey(item.name, item.baseType)];
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

	function formatUpdatedAt(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'recent snapshot';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(date);
	}
</script>

<section class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
	<header
		class="grid gap-5 border-b border-slate-800 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
	>
		<div>
			<div class="flex items-center gap-2 text-amber-300">
				<StarOutline class="size-5" />
				<p class="text-[0.65rem] font-semibold tracking-[0.2em] uppercase">Unique price watch</p>
			</div>
			<h1 class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
				Every unique in {guide.name}
			</h1>
			<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
				See when each item enters the build, compare the current market estimate, and jump directly
				to trade when an upgrade reaches your target price.
			</p>
		</div>

		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
			<div class="rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3">
				<p class="text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">Items</p>
				<p class="mt-1 text-lg font-bold text-white">{uniqueItems.length}</p>
			</div>
			<div class="rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3">
				<p class="text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">Priced</p>
				<p class="mt-1 text-lg font-bold text-cyan-300">{pricedCount}</p>
			</div>
			<div
				class="col-span-2 rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 sm:col-span-1"
			>
				<p class="text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">League</p>
				<p class="mt-1 truncate text-sm font-bold text-white">{league}</p>
			</div>
		</div>
	</header>

	<div
		class="flex flex-col gap-1 border-b border-slate-800 bg-slate-950/20 px-5 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6"
	>
		<p>
			{#if status === 'loading'}
				<span class="animate-pulse">Loading market prices…</span>
			{:else if snapshot}
				Updated {formatUpdatedAt(snapshot.fetchedAt)}
			{:else}
				Price snapshot unavailable
			{/if}
		</p>
		<p>Sorted by the first step where each item appears.</p>
	</div>

	{#if uniqueItems.length}
		<div class="divide-y divide-slate-800">
			{#each uniqueItems as entry (uniquePriceKey(entry.item.name, entry.item.baseType))}
				{@const price = getPrice(entry.item)}
				{@const wikiUrl = buildWikiUrl(entry.item)}
				{@const tradeUrl = buildTradeUrl(entry.item, league)}
				<article
					class="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.8fr)_auto] lg:items-center"
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
								<span class="text-xl font-bold text-amber-200/70">
									{entry.item.name.slice(0, 1)}
								</span>
							{/if}
						</div>
						<div class="min-w-0">
							<p class="text-[0.65rem] font-semibold tracking-[0.16em] text-slate-600 uppercase">
								{entry.slots.join(' · ')}
							</p>
							<h2
								class="mt-1 truncate text-base font-semibold text-amber-200"
								title={entry.item.name}
							>
								{entry.item.name}
							</h2>
							<p class="truncate text-xs text-slate-500">{entry.item.baseType}</p>
							<div class="mt-3">
								{#if price}
									<p class="text-base font-bold text-cyan-300">{formatPrice(price)}</p>
									<p class="text-[0.65rem] text-slate-600">
										{price.listingCount.toLocaleString()} listings
									</p>
								{:else if status === 'loading'}
									<div class="h-5 w-24 animate-pulse rounded bg-slate-800"></div>
								{:else}
									<p class="text-xs text-slate-600">No poe.ninja price found</p>
								{/if}
							</div>
						</div>
					</div>

					<div>
						<p class="text-[0.65rem] font-semibold tracking-[0.16em] text-slate-600 uppercase">
							Appears in
						</p>
						<div class="mt-2 flex flex-wrap gap-2">
							{#each entry.appearances as appearance (appearance.stepId)}
								<button
									type="button"
									onclick={() => onSelectStep(appearance.stepId)}
									class="inline-flex min-w-0 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/45 px-2.5 py-2 text-left transition hover:border-cyan-400/45 hover:text-cyan-300"
									aria-label={`Open step ${appearance.stepNumber}: ${appearance.stepTitle}`}
								>
									<span
										class="grid size-5 shrink-0 place-items-center rounded-full bg-cyan-400/10 text-[0.65rem] font-bold text-cyan-300"
									>
										{appearance.stepNumber}
									</span>
									<span class="max-w-44 truncate text-xs font-semibold text-slate-300">
										{appearance.stepTitle}
									</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- External item URLs must not use SvelteKit's internal route resolver. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<div class="flex flex-wrap gap-2 lg:justify-end">
						<a
							href={wikiUrl}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-300/40 hover:text-amber-200"
							aria-label={`Read about ${entry.item.name} on PoE Wiki`}
						>
							Wiki <ArrowUpRightFromSquareOutline class="size-3.5" />
						</a>
						<a
							href={tradeUrl}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
							aria-label={`Search for ${entry.item.name} on the Path of Exile trade site`}
						>
							Trade search <ArrowUpRightFromSquareOutline class="size-3.5" />
						</a>
					</div>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</article>
			{/each}
		</div>
	{:else}
		<div class="px-6 py-16 text-center">
			<p class="text-sm font-semibold text-slate-400">No unique items found in this build.</p>
			<p class="mt-1 text-xs text-slate-600">
				Import a build with unique equipment to begin tracking prices.
			</p>
		</div>
	{/if}

	<footer
		class="border-t border-slate-800 bg-slate-950/25 px-5 py-3 text-xs text-slate-700 sm:px-6"
	>
		Prices are estimates from
		<a
			href="https://poe.ninja/"
			target="_blank"
			rel="noreferrer"
			class="font-semibold text-slate-500 transition hover:text-cyan-300">poe.ninja</a
		>
		and may differ from live trade listings.
	</footer>
</section>
