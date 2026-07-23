export type TodoPhase = 'during' | 'before-next';

export type GuideTodo = {
	id: string;
	text: string;
	phase: TodoPhase;
	done: boolean;
};

export type PoeNinjaUniqueCategory =
	'UniqueWeapon' | 'UniqueArmour' | 'UniqueAccessory' | 'UniqueFlask' | 'UniqueJewel';

export type GuideUnique = {
	name: string;
	baseType: string;
	slot: string;
	category: PoeNinjaUniqueCategory;
	wikiTitle?: string;
};

export type GuideStep = {
	id: string;
	title: string;
	eyebrow: string;
	description: string;
	uniques: GuideUnique[];
	todos: GuideTodo[];
};

export type BuildGuide = {
	id: string;
	name: string;
	buildVersion: string;
	className: string;
	level: number;
	sourceUrl: string;
	steps: GuideStep[];
};

export type PoeNinjaUniquePrice = {
	name: string;
	baseType: string;
	category: PoeNinjaUniqueCategory;
	chaosValue: number;
	divineValue: number;
	listingCount: number;
	icon?: string;
	variant?: string;
	detailsId?: string;
};

export type PoeNinjaPriceSnapshot = {
	league: string;
	fetchedAt: string;
	source: string;
	prices: Record<string, PoeNinjaUniquePrice>;
	missing: string[];
};
