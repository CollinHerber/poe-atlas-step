import type {
	BuildGuide,
	GuideEquipmentItem,
	GuideGem,
	GuideGemGroup,
	GuideStep,
	GuideTodo,
	GuideUnique
} from '$lib/types/guide';

export type SavedBuildRecord = {
	id: string;
	name: string;
	guide: BuildGuide;
	activeStepId: string;
	createdAt: string;
	updatedAt: string;
};

export const SAVED_BUILDS_KEY = 'atlas-step:saved-builds:v1';

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const isString = (value: unknown, maxLength = 10_000): value is string =>
	typeof value === 'string' && value.length <= maxLength;

const isPobbUrl = (value: unknown) => {
	if (!isString(value, 500)) return false;
	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' && (url.hostname === 'pobb.in' || url.hostname === 'www.pobb.in')
		);
	} catch {
		return false;
	}
};

const isWebUrl = (value: unknown) => {
	if (!isString(value, 1_000)) return false;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
};

const isTodo = (value: unknown): value is GuideTodo =>
	isObject(value) &&
	isString(value.id, 200) &&
	isString(value.text, 2_000) &&
	(value.phase === 'during' || value.phase === 'before-next') &&
	typeof value.done === 'boolean';

const uniqueCategories = new Set([
	'UniqueWeapon',
	'UniqueArmour',
	'UniqueAccessory',
	'UniqueFlask',
	'UniqueJewel'
]);

const isUnique = (value: unknown): value is GuideUnique =>
	isObject(value) &&
	isString(value.name, 300) &&
	isString(value.baseType, 300) &&
	isString(value.slot, 100) &&
	typeof value.category === 'string' &&
	uniqueCategories.has(value.category) &&
	(value.wikiTitle === undefined || isString(value.wikiTitle, 300));

const isGem = (value: unknown): value is GuideGem =>
	isObject(value) &&
	isString(value.id, 300) &&
	isString(value.name, 300) &&
	typeof value.level === 'number' &&
	Number.isFinite(value.level) &&
	value.level >= 0 &&
	value.level <= 40 &&
	typeof value.quality === 'number' &&
	Number.isFinite(value.quality) &&
	value.quality >= 0 &&
	value.quality <= 100 &&
	typeof value.enabled === 'boolean' &&
	typeof value.support === 'boolean';

const isGemGroup = (value: unknown): value is GuideGemGroup =>
	isObject(value) &&
	isString(value.slot, 200) &&
	(value.label === undefined || isString(value.label, 300)) &&
	typeof value.enabled === 'boolean' &&
	Array.isArray(value.gems) &&
	value.gems.length > 0 &&
	value.gems.length <= 20 &&
	value.gems.every(isGem);

const equipmentRarities = new Set(['NORMAL', 'MAGIC', 'RARE', 'UNIQUE']);

const isEquipmentItem = (value: unknown): value is GuideEquipmentItem =>
	isObject(value) &&
	isString(value.slot, 200) &&
	isString(value.name, 300) &&
	isString(value.baseType, 300) &&
	typeof value.rarity === 'string' &&
	equipmentRarities.has(value.rarity) &&
	(value.levelRequirement === undefined ||
		(typeof value.levelRequirement === 'number' &&
			Number.isFinite(value.levelRequirement) &&
			value.levelRequirement >= 0 &&
			value.levelRequirement <= 100)) &&
	Array.isArray(value.stats) &&
	value.stats.length <= 50 &&
	value.stats.every((stat) => isString(stat, 1_000));

const isStep = (value: unknown): value is GuideStep => {
	if (
		!isObject(value) ||
		!isString(value.id, 200) ||
		!isString(value.title, 300) ||
		!isString(value.eyebrow, 300) ||
		!isString(value.description, 4_000) ||
		!Array.isArray(value.uniques) ||
		value.uniques.length > 100 ||
		!value.uniques.every(isUnique) ||
		!Array.isArray(value.todos) ||
		value.todos.length > 250 ||
		!value.todos.every(isTodo)
	) {
		return false;
	}

	if (
		value.equipment !== undefined &&
		(!Array.isArray(value.equipment) ||
			value.equipment.length > 30 ||
			!value.equipment.every(isEquipmentItem))
	) {
		return false;
	}

	if (
		value.gems !== undefined &&
		(!Array.isArray(value.gems) || value.gems.length > 50 || !value.gems.every(isGemGroup))
	) {
		return false;
	}

	if (
		value.noteHighlights !== undefined &&
		(!Array.isArray(value.noteHighlights) ||
			value.noteHighlights.length > 50 ||
			!value.noteHighlights.every((item) => isString(item, 2_000)))
	) {
		return false;
	}

	if (
		value.insights !== undefined &&
		(!Array.isArray(value.insights) ||
			value.insights.length > 100 ||
			!value.insights.every(
				(insight) =>
					isObject(insight) &&
					isString(insight.title, 300) &&
					isString(insight.body, 4_000) &&
					isString(insight.sourceLabel, 300) &&
					isWebUrl(insight.sourceUrl)
			))
	) {
		return false;
	}

	return true;
};

export function isBuildGuide(value: unknown): value is BuildGuide {
	return (
		isObject(value) &&
		isString(value.id, 200) &&
		isString(value.name, 300) &&
		isString(value.buildVersion, 100) &&
		isString(value.className, 200) &&
		typeof value.level === 'number' &&
		Number.isFinite(value.level) &&
		value.level >= 1 &&
		value.level <= 100 &&
		isPobbUrl(value.sourceUrl) &&
		Array.isArray(value.notes) &&
		value.notes.length <= 100 &&
		value.notes.every(
			(note) => isObject(note) && isString(note.title, 300) && isString(note.body, 10_000)
		) &&
		Array.isArray(value.steps) &&
		value.steps.length > 0 &&
		value.steps.length <= 50 &&
		value.steps.every(isStep)
	);
}

const isSavedBuildRecord = (value: unknown): value is SavedBuildRecord =>
	isObject(value) &&
	isString(value.id, 200) &&
	isString(value.name, 200) &&
	isBuildGuide(value.guide) &&
	isString(value.activeStepId, 200) &&
	value.guide.steps.some((step) => step.id === value.activeStepId) &&
	isString(value.createdAt, 100) &&
	isString(value.updatedAt, 100);

export const clonePlainGuide = (guide: BuildGuide): BuildGuide =>
	JSON.parse(JSON.stringify(guide)) as BuildGuide;

export function readSavedBuilds(): SavedBuildRecord[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const parsed = JSON.parse(localStorage.getItem(SAVED_BUILDS_KEY) ?? '[]') as unknown;
		return Array.isArray(parsed) ? parsed.filter(isSavedBuildRecord) : [];
	} catch {
		return [];
	}
}

export function writeSavedBuilds(builds: SavedBuildRecord[]) {
	if (typeof localStorage === 'undefined') return false;
	try {
		localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(builds));
		return true;
	} catch {
		return false;
	}
}

export function createSavedBuildId() {
	return typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `build-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
