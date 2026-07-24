import type { GuideEquipmentItem, GuideUnique } from '$lib/types/guide';

type TradeStatFilter = {
	id: string;
};

const tradeStatIds = {
	life: 'pseudo.pseudo_total_life',
	energyShield: 'pseudo.pseudo_total_energy_shield',
	fireResistance: 'pseudo.pseudo_total_fire_resistance',
	coldResistance: 'pseudo.pseudo_total_cold_resistance',
	lightningResistance: 'pseudo.pseudo_total_lightning_resistance',
	chaosResistance: 'pseudo.pseudo_total_chaos_resistance',
	castSpeed: 'pseudo.pseudo_total_cast_speed',
	movementSpeed: 'pseudo.pseudo_increased_movement_speed',
	globalCriticalChance: 'pseudo.pseudo_global_critical_strike_chance',
	spellCriticalChance: 'pseudo.pseudo_critical_strike_chance_for_spells',
	globalCriticalMultiplier: 'pseudo.pseudo_global_critical_strike_multiplier',
	coldDamage: 'pseudo.pseudo_increased_cold_damage',
	spellDamage: 'pseudo.pseudo_increased_spell_damage',
	addedColdToSpells: 'pseudo.pseudo_adds_cold_damage_to_spells',
	strength: 'pseudo.pseudo_total_strength',
	dexterity: 'pseudo.pseudo_total_dexterity',
	intelligence: 'pseudo.pseudo_total_intelligence',
	allAttributes: 'pseudo.pseudo_total_all_attributes',
	coldSkillLevels: 'explicit.stat_1078455967',
	coldSpellLevels: 'explicit.stat_2254480358',
	spellSkillLevels: 'explicit.stat_124131830',
	shatterCriticalMultiplier: 'explicit.stat_536929014',
	channelingManaCost: 'explicit.stat_2421446548',
	energyShieldRegenNearRare: 'explicit.stat_2238019079',
	physicalTakenAsFire: 'explicit.stat_3342989455',
	physicalTakenAsCold: 'explicit.stat_1871056256',
	physicalTakenAsLightning: 'explicit.stat_425242359',
	coldExposureExplicit: 'explicit.stat_2630708439',
	coldExposureImplicit: 'implicit.stat_3005701891',
	unnerveExplicit: 'explicit.stat_763611529',
	unnerveImplicit: 'implicit.stat_763611529',
	avoidElementalAilments: 'explicit.stat_3005472710',
	projectileSpeed: 'explicit.stat_3759663284',
	projectileDamage: 'explicit.stat_1839076647',
	chanceToFreeze: 'explicit.stat_2309614417',
	nonDamagingAilmentEffect: 'explicit.stat_782230869',
	attackBlock: 'explicit.stat_1702195217',
	spellBlock: 'explicit.stat_561307714',
	increasedBlock: 'explicit.stat_2481353198',
	stunBlockRecovery: 'explicit.stat_2511217560',
	damageAgainstChilled: 'explicit.stat_2805714016',
	multimod: 'explicit.stat_1859333175',
	flaskDuration: 'explicit.stat_3741323227',
	flaskChargesGained: 'explicit.stat_1452809865',
	flaskChargesUsed: 'explicit.stat_644456512'
} as const;

const allResistanceIds = [
	tradeStatIds.fireResistance,
	tradeStatIds.coldResistance,
	tradeStatIds.lightningResistance,
	tradeStatIds.chaosResistance
];

const attributeIds = [
	tradeStatIds.strength,
	tradeStatIds.dexterity,
	tradeStatIds.intelligence,
	tradeStatIds.allAttributes
];

const filtersForStatText = (text: string) => {
	const normalized = text.toLowerCase();
	const ids: string[] = [];
	const add = (...values: string[]) => ids.push(...values);

	if (normalized.includes('resistance')) {
		const namedResistanceIds = [
			normalized.includes('fire') ? tradeStatIds.fireResistance : undefined,
			normalized.includes('cold') ? tradeStatIds.coldResistance : undefined,
			normalized.includes('lightning') ? tradeStatIds.lightningResistance : undefined,
			normalized.includes('chaos') ? tradeStatIds.chaosResistance : undefined
		].filter((id): id is Exclude<typeof id, undefined> => id !== undefined);
		add(...(namedResistanceIds.length ? namedResistanceIds : allResistanceIds));
	}

	if (normalized.includes('maximum life')) add(tradeStatIds.life);
	if (normalized.includes('energy shield') || /\bes\b/u.test(normalized)) {
		add(tradeStatIds.energyShield);
	}
	if (normalized.includes('cast speed')) add(tradeStatIds.castSpeed);
	if (normalized.includes('movement speed')) add(tradeStatIds.movementSpeed);

	if (
		normalized.includes('spell critical chance') ||
		(normalized.includes('critical strike chance') && normalized.includes('spell'))
	) {
		add(tradeStatIds.spellCriticalChance);
	} else if (normalized.includes('global critical strike chance')) {
		add(tradeStatIds.globalCriticalChance);
	}
	if (normalized.includes('critical strike multiplier')) {
		add(
			normalized.includes('shattered')
				? tradeStatIds.shatterCriticalMultiplier
				: tradeStatIds.globalCriticalMultiplier
		);
	}

	if (normalized.includes('cold spell skill gem')) {
		add(tradeStatIds.coldSpellLevels);
	} else if (normalized.includes('cold skill gem')) {
		add(tradeStatIds.coldSkillLevels);
	} else if (normalized.includes('spell skill gem')) {
		add(tradeStatIds.spellSkillLevels);
	} else if (normalized.includes('cold') && normalized.includes('gem level')) {
		add(tradeStatIds.coldSkillLevels, tradeStatIds.coldSpellLevels);
	} else if (normalized.includes('spell') && normalized.includes('gem level')) {
		add(tradeStatIds.spellSkillLevels);
	}

	if (
		normalized.includes('cold damage') &&
		!normalized.includes('taken as') &&
		!normalized.includes('cold damage to spells')
	) {
		add(tradeStatIds.coldDamage);
	}
	if (normalized.includes('spell damage') && !normalized.includes('critical')) {
		add(tradeStatIds.spellDamage);
	}
	if (normalized.includes('cold damage to spells')) add(tradeStatIds.addedColdToSpells);

	if (normalized.includes('required attributes') || normalized === 'attributes') {
		add(...attributeIds);
	} else {
		if (normalized.includes('strength')) add(tradeStatIds.strength);
		if (normalized.includes('dexterity')) add(tradeStatIds.dexterity);
		if (normalized.includes('intelligence')) add(tradeStatIds.intelligence);
		if (normalized.includes('attributes')) add(...attributeIds);
	}

	if (normalized.includes('channelling skills') && normalized.includes('mana cost')) {
		add(tradeStatIds.channelingManaCost);
	}
	if (
		normalized.includes('regenerate') &&
		normalized.includes('energy shield') &&
		normalized.includes('rare or unique enemy')
	) {
		add(tradeStatIds.energyShieldRegenNearRare);
	}
	if (normalized.includes('physical damage taken as elemental')) {
		add(
			tradeStatIds.physicalTakenAsFire,
			tradeStatIds.physicalTakenAsCold,
			tradeStatIds.physicalTakenAsLightning
		);
	} else if (normalized.includes('physical damage') && normalized.includes('taken as')) {
		if (normalized.includes('fire')) add(tradeStatIds.physicalTakenAsFire);
		if (normalized.includes('cold')) add(tradeStatIds.physicalTakenAsCold);
		if (normalized.includes('lightning')) add(tradeStatIds.physicalTakenAsLightning);
	}

	if (normalized.includes('cold exposure')) {
		add(tradeStatIds.coldExposureExplicit, tradeStatIds.coldExposureImplicit);
	}
	if (normalized.includes('unnerve')) {
		add(tradeStatIds.unnerveExplicit, tradeStatIds.unnerveImplicit);
	}
	if (normalized.includes('ailment immunity') || normalized.includes('avoid elemental ailments')) {
		add(tradeStatIds.avoidElementalAilments);
	}
	if (normalized.includes('projectile speed')) add(tradeStatIds.projectileSpeed);
	if (normalized.includes('projectile damage')) add(tradeStatIds.projectileDamage);
	if (normalized.includes('chance to freeze') || normalized.includes('freeze proliferation')) {
		add(tradeStatIds.chanceToFreeze);
	}
	if (normalized.includes('non-damaging ailments')) {
		add(tradeStatIds.nonDamagingAilmentEffect);
	}
	if (normalized.includes('damage with hits against chilled enemies')) {
		add(tradeStatIds.damageAgainstChilled);
	}
	if (normalized.includes('increased chance to block')) {
		add(tradeStatIds.increasedBlock);
	} else if (normalized.includes('block') && !normalized.includes('block recovery')) {
		add(tradeStatIds.attackBlock, tradeStatIds.spellBlock);
	}
	if (normalized.includes('stun and block recovery')) {
		add(tradeStatIds.stunBlockRecovery);
	}
	if (normalized.includes('can have up to 3 crafted modifiers')) {
		add(tradeStatIds.multimod);
	}
	if (normalized.includes('flask')) {
		add(tradeStatIds.flaskDuration, tradeStatIds.flaskChargesGained, tradeStatIds.flaskChargesUsed);
	}

	return ids;
};

export const buildEquipmentTradeFilters = (
	item: GuideEquipmentItem,
	priorities: string[]
): TradeStatFilter[] => {
	const ids = [...item.stats, ...priorities].flatMap(filtersForStatText);
	return [...new Set(ids)].map((id) => ({ id }));
};

const officialTradeUrl = (league: string, query: object) =>
	`https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(query))}`;

const itemFilters = (rarity: GuideEquipmentItem['rarity'], item?: GuideEquipmentItem) => {
	const filters: Record<string, { filters: Record<string, { option: string }> }> = {
		type_filters: {
			filters: {
				rarity: { option: rarity.toLowerCase() }
			}
		}
	};
	const miscFilters: Record<string, { option: string }> = {};
	if (item?.corrupted) miscFilters.corrupted = { option: 'true' };
	if (item?.name.startsWith('Foulborn ')) miscFilters.mutated = { option: 'true' };
	if (Object.keys(miscFilters).length) {
		filters.misc_filters = { filters: miscFilters };
	}
	return filters;
};

export const uniquePriceKey = (name: string, baseType: string) => `${name}|${baseType}`;

export const buildWikiUrl = (item: GuideUnique) => {
	const title = (item.wikiTitle ?? item.name).replaceAll(' ', '_');
	return `https://www.poewiki.net/wiki/${encodeURIComponent(title)}`;
};

export const buildTradeUrl = (item: GuideUnique, league: string) => {
	const foulborn = item.name.startsWith('Foulborn ');
	const query = {
		query: {
			status: { option: 'available' },
			name: foulborn ? item.name.replace(/^Foulborn\s+/u, '') : item.name,
			type: item.baseType,
			stats: [{ type: 'and', filters: [] }],
			...(foulborn
				? {
						filters: {
							misc_filters: {
								filters: { mutated: { option: 'true' } }
							}
						}
					}
				: {})
		},
		sort: { price: 'asc' }
	};

	return officialTradeUrl(league, query);
};

export const buildEquipmentTradeUrl = (
	item: GuideEquipmentItem,
	priorities: string[],
	league: string
) => {
	if (item.rarity === 'UNIQUE') {
		const foulborn = item.name.startsWith('Foulborn ');
		const query = {
			query: {
				status: { option: 'available' },
				name: foulborn ? item.name.replace(/^Foulborn\s+/u, '') : item.name,
				type: item.baseType,
				stats: [{ type: 'and', filters: [] }],
				filters: itemFilters(item.rarity, item)
			},
			sort: { price: 'asc' }
		};
		return officialTradeUrl(league, query);
	}

	const statFilters = buildEquipmentTradeFilters(item, priorities);
	const statGroup =
		item.rarity === 'RARE' && statFilters.length
			? {
					type: 'count',
					value: { min: Math.min(2, statFilters.length) },
					filters: statFilters
				}
			: { type: 'and', filters: statFilters };
	const query = {
		query: {
			status: { option: 'available' },
			type: item.baseType,
			stats: [statGroup],
			filters: itemFilters(item.rarity, item)
		},
		sort: { price: 'asc' }
	};

	return officialTradeUrl(league, query);
};
