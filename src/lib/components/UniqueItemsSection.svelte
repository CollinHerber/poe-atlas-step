<script lang="ts">
	import { buildTradeUrl, buildWikiUrl, uniquePriceKey } from '$lib/poe/items';
	import {
		findUniqueTier,
		uniqueTierClass,
		uniqueTierLabel,
		uniqueTierRarity
	} from '$lib/poe/unique-tiers';
	import type {
		GuideUnique,
		PoeNinjaPriceSnapshot,
		PoeNinjaUniquePrice,
		UniqueTierSnapshot
	} from '$lib/types/guide';

	let {
		items,
		snapshot,
		status,
		tierSnapshot,
		tierStatus
	}: {
		items: GuideUnique[];
		snapshot: PoeNinjaPriceSnapshot | null;
		status: 'loading' | 'ready' | 'unavailable';
		tierSnapshot: UniqueTierSnapshot | null;
		tierStatus: 'loading' | 'ready' | 'unavailable';
	} = $props();

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

<section
	class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 shadow-xl shadow-black/10"
>
	<header
		class="flex flex-col gap-2 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
	>
		<div>
			<h3 class="text-base font-semibold text-slate-100">Unique items</h3>
			<p class="mt-1 text-sm leading-6 text-slate-500">
				Items equipped in this Path of Building checkpoint.
			</p>
		</div>
		<div class="text-left text-xs text-slate-600 sm:text-right">
			{#if status === 'loading'}
				<span class="animate-pulse">Loading market prices…</span>
			{:else if snapshot}
				<p><span class="font-semibold text-slate-400">{snapshot.league}</span> prices</p>
				<p>Updated {formatUpdatedAt(snapshot.fetchedAt)}</p>
			{:else}
				<span>Price snapshot unavailable</span>
			{/if}
		</div>
	</header>

	{#if items.length}
		<div class="grid gap-px bg-slate-800/80 sm:grid-cols-2">
			{#each items as item (`${item.slot}-${item.name}`)}
				{@const price = getPrice(item)}
				{@const tier = findUniqueTier(tierSnapshot, item)}
				{@const tradeUrl = buildTradeUrl(item, league)}
				{@const wikiUrl = buildWikiUrl(item)}
				<article class="flex min-w-0 gap-4 bg-slate-900/95 p-5 sm:p-6">
					<div
						class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-amber-300/20 bg-amber-300/5"
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

					<div class="min-w-0 flex-1">
						<p class="text-[0.65rem] font-semibold tracking-[0.18em] text-slate-600 uppercase">
							{item.slot}
						</p>
						<h4 class="mt-1 truncate text-sm font-semibold text-amber-200" title={item.name}>
							{item.name}
						</h4>
						<p class="truncate text-xs text-slate-500">{item.baseType}</p>
						<div class="mt-2 min-h-6">
							{#if tier}
								<span
									class={`inline-flex items-center rounded-full border px-2 py-1 text-[0.65rem] font-bold ${uniqueTierClass(tier.tier)}`}
									title="Community-estimated unique drop tier from PoE Ladder. T0 is the rarest."
								>
									{uniqueTierLabel(tier.tier)} · {uniqueTierRarity(tier.tier)}
								</span>
							{:else if tierStatus === 'loading'}
								<span class="inline-block h-6 w-20 animate-pulse rounded-full bg-slate-800"></span>
							{:else}
								<span class="text-[0.65rem] font-semibold text-slate-700">Tier unknown</span>
							{/if}
						</div>

						<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
							<div>
								{#if price}
									<p class="text-sm font-bold text-cyan-300">{formatPrice(price)}</p>
									<p class="text-[0.65rem] text-slate-600">
										{price.listingCount.toLocaleString()} listings
									</p>
								{:else if status === 'loading'}
									<div class="h-5 w-20 animate-pulse rounded bg-slate-800"></div>
								{:else}
									<p class="text-xs text-slate-600">No poe.ninja price</p>
								{/if}
							</div>
							<!-- External trade URLs must not use SvelteKit's internal route resolver. -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<div class="flex flex-wrap items-center gap-2">
								<a
									href={wikiUrl}
									target="_blank"
									rel="noreferrer"
									class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-300/40 hover:text-amber-200"
									aria-label={`Read about ${item.name} on PoE Wiki`}
								>
									Wiki <span aria-hidden="true">↗</span>
								</a>
								<a
									href={tradeUrl}
									target="_blank"
									rel="noreferrer"
									class="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
									aria-label={`Search for ${item.name} on the Path of Exile trade site`}
								>
									Trade search <span aria-hidden="true">↗</span>
								</a>
							</div>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</div>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="px-6 py-8 text-center">
			<p class="text-sm font-medium text-slate-500">No unique items equipped in this checkpoint.</p>
			<p class="mt-1 text-xs text-slate-700">This stage is built entirely around rare gear.</p>
		</div>
	{/if}

	<footer
		class="border-t border-slate-800 bg-slate-950/25 px-5 py-3 text-[0.65rem] text-slate-700 sm:px-6"
	>
		Prices are an estimate from
		<a
			href="https://poe.ninja/"
			target="_blank"
			rel="noreferrer"
			class="font-semibold text-slate-500 transition hover:text-cyan-300">poe.ninja</a
		>
		and may differ from live listings. Unique rarity tiers are sourced from
		<a
			href="https://poeladder.com/uniques"
			target="_blank"
			rel="noreferrer"
			class="font-semibold text-slate-500 transition hover:text-amber-200">PoE Ladder</a
		>; T0 is rarest.
	</footer>
</section>
