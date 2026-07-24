<script lang="ts">
	import { ArrowUpRightFromSquareOutline } from 'flowbite-svelte-icons';
	import {
		diffEquipment,
		getCheckpointPriorities,
		getEquipmentPriorities
	} from '$lib/poe/equipment';
	import {
		buildEquipmentTradeFilters,
		buildEquipmentTradeUrl,
		uniquePriceKey
	} from '$lib/poe/items';
	import type {
		GuideEquipmentImplicit,
		GuideEquipmentItem,
		PoeNinjaPriceSnapshot,
		PoeNinjaUniquePrice
	} from '$lib/types/guide';

	let {
		items,
		previousItems,
		previousStepTitle,
		stepId,
		snapshot,
		prioritySourceUrl
	}: {
		items: GuideEquipmentItem[];
		previousItems: GuideEquipmentItem[] | null;
		previousStepTitle?: string;
		stepId: string;
		snapshot: PoeNinjaPriceSnapshot | null;
		prioritySourceUrl: string;
	} = $props();

	let changes = $derived(diffEquipment(previousItems ?? [], items));
	let checkpointPriorities = $derived(getCheckpointPriorities(stepId));
	const league = $derived(snapshot?.league ?? 'Standard');

	const rarityStyles = {
		NORMAL: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
		MAGIC: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
		RARE: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-200',
		UNIQUE: 'border-amber-400/30 bg-amber-400/10 text-amber-300'
	};

	const itemNameStyles = {
		NORMAL: 'text-slate-200',
		MAGIC: 'text-blue-200',
		RARE: 'text-yellow-100',
		UNIQUE: 'text-amber-200'
	};

	const implicitStyles: Record<
		GuideEquipmentImplicit['source'],
		{ label: string; container: string; labelText: string }
	> = {
		eater: {
			label: 'Eater of Worlds · Eldritch Ichor',
			container: 'border-cyan-400/25 bg-cyan-400/8 text-cyan-100',
			labelText: 'text-cyan-400'
		},
		exarch: {
			label: 'Searing Exarch · Eldritch Ember',
			container: 'border-orange-400/25 bg-orange-400/8 text-orange-100',
			labelText: 'text-orange-400'
		},
		anointment: {
			label: 'Anointment',
			container: 'border-violet-400/25 bg-violet-400/8 text-violet-100',
			labelText: 'text-violet-400'
		},
		enchant: {
			label: 'Enchant',
			container: 'border-emerald-400/25 bg-emerald-400/8 text-emerald-100',
			labelText: 'text-emerald-400'
		},
		corruption: {
			label: 'Corrupted implicit',
			container: 'border-rose-400/25 bg-rose-400/8 text-rose-100',
			labelText: 'text-rose-400'
		},
		base: {
			label: 'Item implicit',
			container: 'border-slate-500/25 bg-slate-500/8 text-slate-300',
			labelText: 'text-slate-500'
		}
	};

	function getPrice(item: GuideEquipmentItem): PoeNinjaUniquePrice | undefined {
		if (item.rarity !== 'UNIQUE') return undefined;
		return snapshot?.prices[uniquePriceKey(item.name, item.baseType)];
	}

	function slotMark(slot: string) {
		const marks: Record<string, string> = {
			'Weapon 1': 'W1',
			'Weapon 2': 'W2',
			Helmet: 'HE',
			'Body Armour': 'BO',
			Gloves: 'GL',
			Boots: 'BT',
			Amulet: 'AM',
			'Ring 1': 'R1',
			'Ring 2': 'R2',
			Belt: 'BE',
			'Flask 1': 'F1',
			'Flask 2': 'F2',
			'Flask 3': 'F3',
			'Flask 4': 'F4',
			'Flask 5': 'F5'
		};
		return marks[slot] ?? slot.slice(0, 2).toUpperCase();
	}

	function changeLabel(kind: 'added' | 'removed' | 'replaced' | 'updated') {
		if (kind === 'added') return 'Equipped';
		if (kind === 'removed') return 'Removed';
		if (kind === 'replaced') return 'Replaced';
		return 'Rolls updated';
	}
</script>

<section
	class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 shadow-xl shadow-black/10"
>
	<header
		class="flex flex-col gap-2 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
	>
		<div>
			<h3 class="text-base font-semibold text-slate-100">Equipment</h3>
			<p class="mt-1 text-sm leading-6 text-slate-500">
				The complete equipped loadout, its current modifiers, and what to prioritize next.
			</p>
		</div>
		<p class="text-xs text-slate-600">{items.length} equipped slots</p>
	</header>

	<div class="border-b border-slate-800 bg-slate-950/25 px-5 py-4 sm:px-6">
		<p class="text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
			Checkpoint priorities
		</p>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each checkpointPriorities as priority (priority)}
				<span
					class="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-2.5 py-1 text-[0.7rem] font-medium text-cyan-200"
				>
					{priority}
				</span>
			{/each}
		</div>
	</div>

	<div class="border-b border-slate-800 px-5 py-4 sm:px-6">
		{#if previousItems === null}
			<p class="text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
				Starting equipment
			</p>
			<p class="mt-1 text-sm text-slate-400">
				This is the first loadout, so its equipment is your comparison baseline.
			</p>
		{:else if changes.length === 0}
			<p class="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
				No equipment changes
			</p>
			<p class="mt-1 text-sm text-slate-400">
				This equipment set matches {previousStepTitle ?? 'the previous checkpoint'}.
			</p>
		{:else}
			<p class="text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
				Changes from {previousStepTitle ?? 'the previous checkpoint'}
			</p>
			<div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
				{#each changes as change (change.slot)}
					<div class="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2">
						<div class="flex items-center justify-between gap-2">
							<p class="text-[0.65rem] font-semibold tracking-wider text-slate-500 uppercase">
								{change.slot}
							</p>
							<span class="text-[0.65rem] font-semibold text-cyan-300">
								{changeLabel(change.kind)}
							</span>
						</div>
						{#if change.kind === 'replaced'}
							<p class="mt-1 truncate text-xs text-slate-300">
								<span class="text-slate-600">{change.before?.name}</span>
								<span aria-hidden="true"> → </span>
								{change.after?.name}
							</p>
						{:else}
							<p class="mt-1 truncate text-xs text-slate-300">
								{change.after?.name ?? change.before?.name}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if items.length}
		<div class="grid gap-px bg-slate-800/80 xl:grid-cols-2">
			{#each items as item (item.slot)}
				{@const priorities = getEquipmentPriorities(item)}
				{@const price = getPrice(item)}
				{@const tradeFilters = buildEquipmentTradeFilters(item, priorities)}
				{@const tradeUrl = buildEquipmentTradeUrl(item, priorities, league)}
				<article class="min-w-0 bg-slate-900/95 p-5 sm:p-6">
					<div class="flex items-start gap-3">
						<div
							class={[
								'grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border text-xs font-bold',
								rarityStyles[item.rarity]
							]}
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
								{slotMark(item.slot)}
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<p class="text-[0.65rem] font-semibold tracking-[0.18em] text-slate-600 uppercase">
									{item.slot}
								</p>
								<span
									class={[
										'rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold',
										rarityStyles[item.rarity]
									]}
								>
									{item.rarity}
								</span>
							</div>
							<h4
								class={['mt-1 truncate text-sm font-semibold', itemNameStyles[item.rarity]]}
								title={item.name}
							>
								{item.name}
							</h4>
							<p class="truncate text-xs text-slate-500">
								{item.baseType}
								{#if item.levelRequirement}
									<span class="text-slate-700"> · Requires {item.levelRequirement}</span>
								{/if}
							</p>
						</div>
					</div>

					{#if item.implicits?.length}
						<div class="mt-4">
							<p class="text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">
								Implicits to roll
							</p>
							<div class="mt-2 grid gap-2">
								{#each item.implicits as implicit, implicitIndex (`${implicit.source}-${implicit.text}-${implicitIndex}`)}
									{@const presentation = implicitStyles[implicit.source]}
									<div class={['rounded-lg border px-3 py-2', presentation.container]}>
										<p
											class={[
												'text-[0.6rem] font-bold tracking-[0.12em] uppercase',
												presentation.labelText
											]}
										>
											{presentation.label}
										</p>
										<p class="mt-1 text-xs leading-5">{implicit.text}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="mt-4">
						<p class="text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">
							Target stats
						</p>
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each priorities as priority (priority)}
								<span
									class="rounded-md border border-violet-400/15 bg-violet-400/8 px-2 py-1 text-[0.65rem] font-medium text-violet-200"
								>
									{priority}
								</span>
							{/each}
						</div>
					</div>

					<div class="mt-4">
						<p class="text-[0.65rem] font-semibold tracking-wider text-slate-600 uppercase">
							PoB modifiers
						</p>
						{#if item.stats.length}
							<ul class="mt-2 space-y-1.5">
								{#each item.stats.slice(0, 4) as stat, statIndex (`${stat}-${statIndex}`)}
									<li class="flex gap-2 text-xs leading-5 text-slate-400">
										<span class="mt-2 size-1 shrink-0 rounded-full bg-slate-700"></span>
										<span>{stat}</span>
									</li>
								{/each}
							</ul>
							{#if item.stats.length > 4}
								<details class="mt-2">
									<summary
										class="cursor-pointer text-[0.7rem] font-semibold text-cyan-400 transition hover:text-cyan-300"
									>
										Show {item.stats.length - 4} more modifiers
									</summary>
									<ul class="mt-2 space-y-1.5">
										{#each item.stats.slice(4) as stat, statIndex (`more-${stat}-${statIndex}`)}
											<li class="flex gap-2 text-xs leading-5 text-slate-400">
												<span class="mt-2 size-1 shrink-0 rounded-full bg-slate-700"></span>
												<span>{stat}</span>
											</li>
										{/each}
									</ul>
								</details>
							{/if}
						{:else}
							<p class="mt-2 text-xs text-slate-600">No explicit modifiers recorded in the PoB.</p>
						{/if}
					</div>

					<div class="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-4">
						<!-- External trade URLs must not use SvelteKit's internal route resolver. -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={tradeUrl}
							target="_blank"
							rel="noreferrer"
							aria-label={`Search for ${item.name} upgrades on the Path of Exile trade site`}
							class="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/8 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/60 hover:bg-cyan-400/15 hover:text-cyan-200"
						>
							Trade search <ArrowUpRightFromSquareOutline class="size-3.5" />
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{#if item.rarity === 'RARE' && tradeFilters.length}
							<p class="text-[0.65rem] text-slate-600">
								Matches any 2 of {tradeFilters.length} PoB and priority stats
							</p>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="px-6 py-8 text-center">
			<p class="text-sm font-medium text-slate-500">No equipped items found for this checkpoint.</p>
			<p class="mt-1 text-xs text-slate-700">Refresh the imported PoB equipment data.</p>
		</div>
	{/if}

	<footer
		class="border-t border-slate-800 bg-slate-950/25 px-5 py-3 text-[0.65rem] text-slate-700 sm:px-6"
	>
		Equipped modifiers come from the source PoB. Starter priorities are informed by the
		<!-- External guide URLs must not use SvelteKit's internal route resolver. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={prioritySourceUrl}
			target="_blank"
			rel="noreferrer"
			class="font-semibold text-slate-500 transition hover:text-cyan-300">Winter Orb guide ↗</a
		>
		and adapted to each checkpoint.
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</footer>
</section>
