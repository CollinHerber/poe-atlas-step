import { gemColorForId } from '$lib/poe/gem-colors';
import { isBuildGuide } from '$lib/persistence/build-library';
import type {
	BuildGuide,
	GuideCharacterStat,
	GuideConfigurationValue,
	GuideEquipmentItem,
	GuideGemGroup,
	GuideInsight,
	GuideNoteSection,
	GuideStep,
	GuideTodo,
	GuideUnique,
	PoeNinjaUniqueCategory
} from '$lib/types/guide';

export type PobbImportSummary = {
	loadoutCount: number;
	equipmentCount: number;
	gemCount: number;
	uniqueCount: number;
	noteCount: number;
};

export type PobbImportResult = {
	guide: BuildGuide;
	summary: PobbImportSummary;
};

type TitledBlock = {
	id: string;
	title: string;
	block: string;
};

type ParsedItem = Omit<GuideEquipmentItem, 'slot'>;

const POBB_URL_PATTERN = /^https?:\/\/(?:www\.)?pobb\.in\/([A-Za-z0-9_-]+)\/?$/iu;
const MAX_RAW_CODE_CHARACTERS = 2_000_000;
const MAX_XML_BYTES = 10_000_000;
const MAX_STEPS = 50;

const equipmentSlotOrder = new Map(
	[
		'Weapon 1',
		'Weapon 2',
		'Helmet',
		'Body Armour',
		'Gloves',
		'Boots',
		'Amulet',
		'Ring 1',
		'Ring 2',
		'Belt',
		'Flask 1',
		'Flask 2',
		'Flask 3',
		'Flask 4',
		'Flask 5'
	].map((slot, index) => [slot, index])
);

const flaskBaseTypes = [
	'Divine Life Flask',
	'Eternal Life Flask',
	'Divine Mana Flask',
	'Eternal Mana Flask',
	'Diamond Flask',
	'Granite Flask',
	'Jade Flask',
	'Quartz Flask',
	'Quicksilver Flask',
	'Silver Flask',
	'Bismuth Flask',
	'Basalt Flask',
	'Amethyst Flask',
	'Aquamarine Flask',
	'Ruby Flask',
	'Sapphire Flask',
	'Topaz Flask',
	'Sulphur Flask',
	'Stibnite Flask'
];

const decodeXml = (value: string) =>
	value
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'")
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&amp;', '&')
		.replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code)))
		.replace(/&#x([\dA-F]+);/giu, (_, code: string) =>
			String.fromCodePoint(Number.parseInt(code, 16))
		);

const readAttribute = (tag: string, name: string) => {
	const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'u'));
	return match ? decodeXml(match[1]) : '';
};

const readBooleanAttribute = (tag: string, name: string, fallback = true) => {
	const value = readAttribute(tag, name);
	return value ? value === 'true' : fallback;
};

const readNumberAttribute = (tag: string, name: string) => {
	const value = Number(readAttribute(tag, name));
	return Number.isFinite(value) ? value : 0;
};

const openingTag = (block: string, tagName: string) =>
	block.match(new RegExp(`^<${tagName}\\b[^>]*>`, 'u'))?.[0] ?? '';

const extractBlocks = (xml: string, tagName: string) =>
	[...xml.matchAll(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?</${tagName}>`, 'gu'))].map(
		(match) => match[0]
	);

const titledBlocks = (xml: string, tagName: string): TitledBlock[] =>
	extractBlocks(xml, tagName).map((block) => {
		const tag = openingTag(block, tagName);
		return {
			id: readAttribute(tag, 'id'),
			title: readAttribute(tag, 'title'),
			block
		};
	});

const stripPobFormatting = (value: string) =>
	value
		.replace(/\^\d+/gu, '')
		.replace(/\s*\{[\d,\s]+\}\s*$/u, '')
		.trim();

const normalizedTitle = (value: string) =>
	stripPobFormatting(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, ' ')
		.trim();

const titleReferences = (value: string) =>
	new Set(
		(value.match(/\{([\d,\s]+)\}\s*$/u)?.[1] ?? '')
			.split(',')
			.map((part) => part.trim())
			.filter(Boolean)
	);

const isSeparatorTitle = (value: string) => /~{3,}/u.test(value) || !normalizedTitle(value);

const levelFromTitle = (value: string) => {
	const match = stripPobFormatting(value).match(/\blevel\s*(\d+)/iu);
	return match ? Number(match[1]) : undefined;
};

const levelRangeFromTitle = (value: string) => {
	const match = stripPobFormatting(value).match(/\blevel\s*(\d+)\s*-\s*(\d+|maps?)\b/iu);
	if (!match) return undefined;
	return {
		minimum: Number(match[1]),
		maximum: /^maps?$/iu.test(match[2]) ? 100 : Number(match[2])
	};
};

const hasAscendancy = (value: string) => Boolean(value && value !== 'nil' && value !== '0');

const ascendancyAllocations = (allocatedWithoutStart: number) => {
	if (allocatedWithoutStart <= 38) return 0;
	if (allocatedWithoutStart <= 69) return 3;
	if (allocatedWithoutStart <= 90) return 5;
	if (allocatedWithoutStart <= 98) return 7;
	return 9;
};

const campaignQuestPoints = (allocatedAfterAscendancyAndBandit: number) => {
	if (allocatedAfterAscendancyAndBandit <= 11) return 0;
	if (allocatedAfterAscendancyAndBandit <= 23) return 2;
	if (allocatedAfterAscendancyAndBandit <= 34) return 3;
	if (allocatedAfterAscendancyAndBandit <= 44) return 5;
	if (allocatedAfterAscendancyAndBandit <= 49) return 6;
	if (allocatedAfterAscendancyAndBandit <= 57) return 8;
	if (allocatedAfterAscendancyAndBandit <= 64) return 11;
	if (allocatedAfterAscendancyAndBandit <= 73) return 14;
	if (allocatedAfterAscendancyAndBandit <= 80) return 17;
	if (allocatedAfterAscendancyAndBandit <= 85) return 19;
	return 22;
};

const parseTreeProgress = (
	loadout: TitledBlock,
	buildLevel: number,
	bandit: string
): Pick<GuideStep, 'level' | 'allocatedPassivePoints'> => {
	const treeTag = openingTag(loadout.block, 'Spec');
	const nodes = readAttribute(treeTag, 'nodes')
		.split(',')
		.map((node) => node.trim())
		.filter(Boolean);

	if (!treeTag || !nodes.length) {
		return { level: levelFromTitle(loadout.title) ?? buildLevel };
	}

	const allocatedWithoutStart = Math.max(nodes.length - 1, 0);
	const ascendancyPoints = hasAscendancy(readAttribute(treeTag, 'ascendClassId'))
		? ascendancyAllocations(allocatedWithoutStart)
		: 0;
	const secondaryAscendancyPoints = hasAscendancy(readAttribute(treeTag, 'secondaryAscendClassId'))
		? ascendancyAllocations(allocatedWithoutStart)
		: 0;
	const allocatedPassivePoints = Math.max(
		allocatedWithoutStart - ascendancyPoints - secondaryAscendancyPoints,
		0
	);
	const banditPoints = bandit && bandit !== 'None' ? 0 : allocatedWithoutStart > 21 ? 2 : 0;
	const questPoints = campaignQuestPoints(allocatedWithoutStart - ascendancyPoints - banditPoints);
	const level = Math.min(
		Math.max(
			1 +
				allocatedWithoutStart -
				ascendancyPoints -
				secondaryAscendancyPoints -
				banditPoints -
				questPoints,
			1
		),
		100
	);

	return { level, allocatedPassivePoints };
};

const findMatchingSet = (
	loadout: TitledBlock,
	sets: TitledBlock[],
	kind: 'items' | 'skills' | 'config'
) => {
	const loadoutTitle = normalizedTitle(loadout.title);
	const loadoutReferences = titleReferences(loadout.title);
	const loadoutLevel = levelFromTitle(loadout.title);
	let best: { block: TitledBlock; score: number } | undefined;

	for (const candidate of sets) {
		if (isSeparatorTitle(candidate.title)) continue;
		const candidateTitle = normalizedTitle(candidate.title);
		const candidateReferences = titleReferences(candidate.title);
		let score = 0;

		if (candidate.title === loadout.title) score = 1_000;
		else if (candidateTitle && candidateTitle === loadoutTitle) score = 900;
		else if (
			loadoutReferences.size &&
			[...loadoutReferences].some((reference) => candidateReferences.has(reference))
		) {
			score = 800;
		} else if (kind === 'skills' && loadoutLevel !== undefined) {
			const range = levelRangeFromTitle(candidate.title);
			if (range && loadoutLevel >= range.minimum && loadoutLevel <= range.maximum) {
				score = 700 + range.minimum;
			}
		} else if (
			loadoutTitle.length >= 4 &&
			candidateTitle.length >= 4 &&
			(loadoutTitle.includes(candidateTitle) || candidateTitle.includes(loadoutTitle))
		) {
			score = 400;
		}

		if (score && (!best || score > best.score)) best = { block: candidate, score };
	}

	return best?.block ?? (sets.length === 1 ? sets[0] : undefined);
};

const cleanStat = (line: string) =>
	line
		.replace(/\{[^}]*\}/gu, '')
		.trim()
		.slice(0, 1_000);

const implicitSource = (line: string, text: string) => {
	if (line.includes('{eater}')) return 'eater' as const;
	if (line.includes('{exarch}')) return 'exarch' as const;
	if (line.includes('{crafted}') && text.startsWith('Allocates ')) return 'anointment' as const;
	if (line.includes('{crafted}')) return 'enchant' as const;
	return 'base' as const;
};

const appliesToVariant = (line: string, selectedVariant?: string) => {
	const match = line.match(/\{variant:([^}]+)\}/u);
	if (!match) return true;
	if (!selectedVariant) return false;
	return match[1].split(',').includes(selectedVariant);
};

const parseItems = (xml: string) => {
	const items = new Map<string, ParsedItem>();

	for (const block of extractBlocks(xml, 'Item')) {
		const tag = openingTag(block, 'Item');
		const itemId = readAttribute(tag, 'id');
		if (!itemId) continue;

		const itemText = block.replace(/^<Item\b[^>]*>/u, '').replace(/<\/Item>$/u, '');
		const lines = decodeXml(itemText.replace(/<[^>]+>/gu, ''))
			.split(/\r?\n/u)
			.map((line) => line.trim())
			.filter(Boolean);
		const rarityIndex = lines.findIndex((line) => line.startsWith('Rarity:'));
		if (rarityIndex < 0) continue;

		const rarity = lines[rarityIndex].slice('Rarity:'.length).trim();
		if (!['NORMAL', 'MAGIC', 'RARE', 'UNIQUE'].includes(rarity)) continue;
		const name = lines[rarityIndex + 1];
		const possibleBaseType = lines[rarityIndex + 2];
		const baseType =
			rarity === 'NORMAL'
				? name
				: rarity === 'MAGIC'
					? (flaskBaseTypes.find((candidate) => name?.includes(candidate)) ??
						(possibleBaseType && !possibleBaseType.includes(':') ? possibleBaseType : name))
					: possibleBaseType;
		if (!name || !baseType) continue;

		const selectedVariant = lines
			.find((line) => line.startsWith('Selected Variant:'))
			?.slice('Selected Variant:'.length)
			.trim();
		const levelRequirement = Number(
			lines.find((line) => line.startsWith('LevelReq:'))?.slice('LevelReq:'.length)
		);
		const implicitIndex = lines.findIndex((line) => line.startsWith('Implicits:'));
		const implicitCount =
			implicitIndex < 0 ? 0 : Number(lines[implicitIndex].slice('Implicits:'.length));
		const corrupted = lines.includes('Corrupted');
		const modifierLines =
			implicitIndex < 0
				? []
				: lines.slice(implicitIndex + 1).filter((line) => appliesToVariant(line, selectedVariant));
		const implicits = modifierLines
			.slice(0, implicitCount)
			.flatMap((line) => {
				const text = cleanStat(line);
				return text ? [{ text, source: implicitSource(line, text) }] : [];
			})
			.slice(0, 10);
		const stats = modifierLines
			.slice(implicitCount)
			.map(cleanStat)
			.filter((line) => line && line !== 'Corrupted')
			.slice(0, 50);

		items.set(itemId, {
			name: name.slice(0, 300),
			baseType: baseType.slice(0, 300),
			rarity: rarity as ParsedItem['rarity'],
			...(Number.isFinite(levelRequirement) && levelRequirement > 0 ? { levelRequirement } : {}),
			...(corrupted ? { corrupted: true } : {}),
			...(implicits.length ? { implicits } : {}),
			stats
		});
	}

	const itemIdentity = (item: ParsedItem) => `${item.name.toLowerCase()}\u0000${item.baseType}`;
	const uniqueIdentities = new Set(
		[...items.values()].filter((item) => item.rarity === 'UNIQUE').map((item) => itemIdentity(item))
	);
	for (const item of items.values()) {
		const inferredCorruption = item.rarity === 'RARE' && uniqueIdentities.has(itemIdentity(item));
		if (inferredCorruption) {
			item.rarity = 'UNIQUE';
			item.corrupted = true;
		}
		if (item.corrupted && item.implicits?.length) {
			item.implicits = item.implicits.map((implicit) =>
				implicit.source === 'base' ? { ...implicit, source: 'corruption' as const } : implicit
			);
		}
	}

	return items;
};

const parseEquipment = (itemSet: TitledBlock | undefined, items: Map<string, ParsedItem>) => {
	if (!itemSet) return [];
	const bySlot = new Map<string, GuideEquipmentItem>();

	for (const match of itemSet.block.matchAll(/<Slot\b[^>]*>/gu)) {
		const slot = readAttribute(match[0], 'name').slice(0, 200);
		const itemId = readAttribute(match[0], 'itemId');
		const item = items.get(itemId);
		if (slot && itemId && itemId !== '0' && item && !bySlot.has(slot)) {
			bySlot.set(slot, { slot, ...item });
		}
	}

	return [...bySlot.values()]
		.sort((left, right) => {
			const leftOrder = equipmentSlotOrder.get(left.slot) ?? 100;
			const rightOrder = equipmentSlotOrder.get(right.slot) ?? 100;
			return leftOrder - rightOrder || left.slot.localeCompare(right.slot);
		})
		.slice(0, 30);
};

const humanizeIdentifier = (value: string) =>
	value
		.replace(/^Support/u, '')
		.replace(/([a-z\d])([A-Z])/gu, '$1 $2')
		.trim();

const parseGemGroups = (skillSet: TitledBlock | undefined): GuideGemGroup[] => {
	if (!skillSet) return [];
	const groups: GuideGemGroup[] = [];

	for (const skillBlock of extractBlocks(skillSet.block, 'Skill')) {
		const tag = openingTag(skillBlock, 'Skill');
		const gems = [...skillBlock.matchAll(/<Gem\b[^>]*\/?>/gu)]
			.flatMap((match) => {
				const gemId = readAttribute(match[0], 'gemId');
				const variantId = readAttribute(match[0], 'variantId');
				const skillId = readAttribute(match[0], 'skillId');
				const id = (variantId || skillId || gemId).slice(0, 300);
				const name =
					readAttribute(match[0], 'nameSpec') ||
					humanizeIdentifier(variantId || skillId || gemId.split('/').at(-1) || '');
				if (!id || !name) return [];
				const color = gemColorForId(id);

				return [
					{
						id,
						name: name.slice(0, 300),
						...(color ? { color } : {}),
						level: Math.min(Math.max(readNumberAttribute(match[0], 'level'), 0), 40),
						quality: Math.min(Math.max(readNumberAttribute(match[0], 'quality'), 0), 100),
						enabled: readBooleanAttribute(match[0], 'enabled'),
						support: gemId.includes('/SupportGem') || id.startsWith('Support')
					}
				];
			})
			.slice(0, 20);
		if (!gems.length) continue;

		const slot = (readAttribute(tag, 'slot') || 'Granted skill').slice(0, 200);
		const label = readAttribute(tag, 'label').slice(0, 300);
		groups.push({
			slot,
			...(label ? { label } : {}),
			enabled: readBooleanAttribute(tag, 'enabled'),
			gems
		});
	}

	return groups.slice(0, 50);
};

const parseCharacterStats = (buildBlock: string): GuideCharacterStat[] => {
	const stats = new Map<string, GuideCharacterStat>();

	for (const match of buildBlock.matchAll(/<PlayerStat\b[^>]*\/?>/gu)) {
		const name = readAttribute(match[0], 'stat').slice(0, 300);
		const value = Number(readAttribute(match[0], 'value'));
		if (name && Number.isFinite(value)) stats.set(name, { name, value });
	}

	return [...stats.values()].slice(0, 250);
};

const parseConfiguration = (configSet: TitledBlock | undefined): GuideConfigurationValue[] => {
	if (!configSet) return [];
	const values = new Map<string, GuideConfigurationValue>();

	for (const match of configSet.block.matchAll(/<Input\b[^>]*\/?>/gu)) {
		const name = readAttribute(match[0], 'name').slice(0, 300);
		if (!name) continue;

		const booleanValue = readAttribute(match[0], 'boolean');
		const numberValue = readAttribute(match[0], 'number');
		const stringValue = readAttribute(match[0], 'string');
		let value: GuideConfigurationValue['value'];

		if (booleanValue) {
			value = booleanValue === 'true';
		} else if (numberValue) {
			const parsed = Number(numberValue);
			if (!Number.isFinite(parsed)) continue;
			value = parsed;
		} else {
			value = stringValue.slice(0, 4_000);
		}

		values.set(name, { name, value });
	}

	return [...values.values()].slice(0, 250);
};

const parseBuildConfiguration = (buildTag: string): GuideConfigurationValue[] =>
	['bandit', 'pantheonMajorGod', 'pantheonMinorGod'].flatMap((name) => {
		const value = readAttribute(buildTag, name).slice(0, 4_000);
		return value ? [{ name, value }] : [];
	});

const mergeConfiguration = (
	base: GuideConfigurationValue[],
	overrides: GuideConfigurationValue[]
) => {
	const values = new Map(base.map((value) => [value.name, value]));
	for (const value of overrides) values.set(value.name, value);
	return [...values.values()].slice(0, 250);
};

const activeLoadoutIndex = (
	xml: string,
	allTreeSpecs: TitledBlock[],
	availableLoadouts: TitledBlock[]
) => {
	const treeTag = openingTag(extractBlocks(xml, 'Tree')[0] ?? '', 'Tree');
	const activeSpec = Number(readAttribute(treeTag, 'activeSpec'));
	if (!Number.isInteger(activeSpec)) return -1;
	const activeTreeSpec =
		(activeSpec >= 1 ? allTreeSpecs[activeSpec - 1] : undefined) ?? allTreeSpecs[activeSpec];
	if (!activeTreeSpec) return -1;
	return availableLoadouts.findIndex((loadout) => loadout === activeTreeSpec);
};

const normalizeUniqueName = (name: string, baseType: string) =>
	baseType === 'Timeless Jewel' ? name.replace(/\s+\[[^\]]+\]$/u, '') : name;

const categoryFor = (slot: string, baseType: string): PoeNinjaUniqueCategory => {
	if (slot.startsWith('Jewel ') || /Jewel$/u.test(baseType)) return 'UniqueJewel';
	if (slot.startsWith('Flask ') || /Flask$/u.test(baseType)) return 'UniqueFlask';
	if (['Amulet', 'Ring 1', 'Ring 2', 'Belt'].includes(slot) || slot.startsWith('Charm')) {
		return 'UniqueAccessory';
	}
	if (['Helmet', 'Body Armour', 'Gloves', 'Boots'].includes(slot) || /Shield$/u.test(baseType)) {
		return 'UniqueArmour';
	}
	return 'UniqueWeapon';
};

const parseUniques = (
	equipment: GuideEquipmentItem[],
	treeSpec: TitledBlock | undefined,
	items: Map<string, ParsedItem>
): GuideUnique[] => {
	const references: Array<{ slot: string; item: ParsedItem }> = equipment
		.filter((item) => item.rarity === 'UNIQUE')
		.map((item) => ({ slot: item.slot, item }));

	if (treeSpec) {
		for (const match of treeSpec.block.matchAll(/<Socket\b[^>]*>/gu)) {
			const nodeId = readAttribute(match[0], 'nodeId');
			const itemId = readAttribute(match[0], 'itemId');
			const item = items.get(itemId);
			if (nodeId && itemId && itemId !== '0' && item?.rarity === 'UNIQUE') {
				references.push({ slot: `Jewel ${nodeId}`, item });
			}
		}
	}

	return references
		.map(({ slot, item }) => ({
			name: normalizeUniqueName(item.name, item.baseType),
			baseType: item.baseType,
			slot: slot.startsWith('Jewel ') ? 'Jewel' : slot,
			category: categoryFor(slot, item.baseType)
		}))
		.slice(0, 100);
};

const parseNotes = (xml: string): GuideNoteSection[] => {
	const rawNotes = xml.match(/<Notes>([\s\S]*?)<\/Notes>/u)?.[1];
	if (!rawNotes) return [];
	const notes = decodeXml(rawNotes).replace(/\r\n?/gu, '\n').trim();
	if (!notes) return [];

	const chunks = notes
		.split(/\n{2,}/u)
		.map((chunk) => chunk.trim())
		.filter(Boolean)
		.flatMap((chunk) => {
			if (chunk.length <= 9_000) return [chunk];
			const pieces: string[] = [];
			for (let index = 0; index < chunk.length; index += 9_000) {
				pieces.push(chunk.slice(index, index + 9_000));
			}
			return pieces;
		})
		.slice(0, 100);

	const usedTitles = new Map<string, number>();
	return chunks.map((chunk, index) => {
		const lines = chunk
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
		const firstLine = lines[0] ?? '';
		const hasHeading = lines.length > 1 && firstLine.length <= 100;
		const baseTitle = hasHeading
			? firstLine.replace(/[:=-]+$/u, '').slice(0, 280)
			: `Build notes ${index + 1}`;
		const occurrence = usedTitles.get(baseTitle) ?? 0;
		usedTitles.set(baseTitle, occurrence + 1);
		return {
			title: occurrence ? `${baseTitle} (${occurrence + 1})`.slice(0, 300) : baseTitle,
			body: (hasHeading ? lines.slice(1).join('\n') : lines.join('\n')).slice(0, 10_000)
		};
	});
};

const todo = (id: string, text: string, phase: GuideTodo['phase']): GuideTodo => ({
	id,
	text,
	phase,
	done: false
});

const createStep = (
	loadout: TitledBlock,
	index: number,
	itemSets: TitledBlock[],
	skillSets: TitledBlock[],
	configSets: TitledBlock[],
	fallbackConfigSet: TitledBlock | undefined,
	buildConfiguration: GuideConfigurationValue[],
	items: Map<string, ParsedItem>,
	characterStats: GuideCharacterStat[],
	sourceUrl: string,
	buildLevel: number,
	bandit: string
): GuideStep => {
	const title = (stripPobFormatting(loadout.title) || `Loadout ${index + 1}`).slice(0, 300);
	const itemSet = findMatchingSet(loadout, itemSets, 'items');
	const skillSet = findMatchingSet(loadout, skillSets, 'skills');
	const configSet = findMatchingSet(loadout, configSets, 'config') ?? fallbackConfigSet;
	const equipment = parseEquipment(itemSet, items);
	const gems = parseGemGroups(skillSet);
	const configuration = mergeConfiguration(buildConfiguration, parseConfiguration(configSet));
	const uniques = parseUniques(equipment, loadout.block ? loadout : undefined, items);
	const progress = parseTreeProgress(loadout, buildLevel, bandit);
	const todos: GuideTodo[] = [
		todo(
			`imported-${index + 1}-tree`,
			`Review the ${title} passive tree and masteries in Path of Building`,
			'during'
		)
	];

	if (equipment.length) {
		todos.push(
			todo(
				`imported-${index + 1}-equipment`,
				`Acquire and equip the ${equipment.length} imported item slots for this loadout`,
				'during'
			)
		);
	}
	if (gems.length) {
		const gemCount = gems.reduce((total, group) => total + group.gems.length, 0);
		todos.push(
			todo(
				`imported-${index + 1}-gems`,
				`Socket and link the ${gemCount} imported gems across ${gems.length} groups`,
				'during'
			)
		);
	}
	todos.push(
		todo(
			`imported-${index + 1}-validate`,
			'Validate attributes, resistances, reservation, defenses, and the main skill before advancing',
			'before-next'
		)
	);

	const captured: string[] = ['passive tree'];
	if (equipment.length) captured.push(`${equipment.length} equipment slots`);
	if (gems.length) captured.push(`${gems.length} gem groups`);
	const insight: GuideInsight = {
		title: 'Imported Path of Building loadout',
		body: `This baseline captured ${captured.join(', ')}. Add your own transition instructions and readiness checks as you work through it.`,
		sourceLabel: `pobb.in · ${title}`.slice(0, 300),
		sourceUrl
	};
	const slug = normalizedTitle(title).replaceAll(' ', '-').slice(0, 80) || `loadout-${index + 1}`;

	return {
		id: `imported-${index + 1}-${slug}`,
		title,
		eyebrow: `Loadout ${index + 1}`,
		description: `Build an editable baseline for the ${title} checkpoint using the data available in the imported Path of Building.`,
		...progress,
		uniques,
		...(equipment.length ? { equipment } : {}),
		...(gems.length ? { gems } : {}),
		...(characterStats.length ? { characterStats } : {}),
		...(configuration.length ? { configuration } : {}),
		insights: [insight],
		todos
	};
};

const fallbackLoadouts = (itemSets: TitledBlock[], skillSets: TitledBlock[]) => {
	const loadouts = new Map<string, TitledBlock>();
	for (const block of [...itemSets, ...skillSets]) {
		if (isSeparatorTitle(block.title)) continue;
		const key = normalizedTitle(block.title) || block.id || `loadout-${loadouts.size + 1}`;
		if (!loadouts.has(key)) loadouts.set(key, block);
	}
	return [...loadouts.values()];
};

const decodePobCode = async (code: string) => {
	const compactCode = code.replace(/\s+/gu, '');
	if (
		!compactCode ||
		compactCode.length > MAX_RAW_CODE_CHARACTERS ||
		!/^[A-Za-z0-9_-]+={0,2}$/u.test(compactCode)
	) {
		throw new Error('The pobb.in response did not contain a valid Path of Building export.');
	}

	const base64 = compactCode.replaceAll('-', '+').replaceAll('_', '/');
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
	const binary = atob(padded);
	const compressed = Uint8Array.from(binary, (character) => character.charCodeAt(0));
	const buffer = new ArrayBuffer(compressed.byteLength);
	new Uint8Array(buffer).set(compressed);
	const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('deflate'));
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let length = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		length += value.byteLength;
		if (length > MAX_XML_BYTES) {
			await reader.cancel();
			throw new Error('This Path of Building is too large to import safely.');
		}
		chunks.push(value);
	}

	const output = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(output);
};

const readerCode = (responseText: string) => {
	const marker = 'Markdown Content:';
	const content = responseText.includes(marker)
		? responseText.slice(responseText.indexOf(marker) + marker.length)
		: responseText;
	return content.trim();
};

export const parsePobbUrl = (url: string) => {
	const match = url.trim().match(POBB_URL_PATTERN);
	return match && match[1].length <= 100
		? { id: match[1], url: `https://pobb.in/${match[1]}` }
		: undefined;
};

export async function buildGuideFromPobCode(
	code: string,
	sourceUrl: string
): Promise<PobbImportResult> {
	const source = parsePobbUrl(sourceUrl);
	if (!source) throw new Error('Paste a full pobb.in link.');
	const xml = await decodePobCode(code);
	if (!xml.includes('<PathOfBuilding')) {
		throw new Error('The imported data is not a supported Path of Building document.');
	}

	const buildBlock = extractBlocks(xml, 'Build')[0] ?? '';
	const buildTag = openingTag(buildBlock, 'Build') || xml.match(/<Build\b[^>]*>/u)?.[0] || '';
	const level = Math.min(Math.max(readNumberAttribute(buildTag, 'level') || 1, 1), 100);
	const bandit = readAttribute(buildTag, 'bandit');
	const allTreeSpecs = titledBlocks(xml, 'Spec');
	const treeSpecs = allTreeSpecs.filter((block) => !isSeparatorTitle(block.title));
	let itemSets = titledBlocks(xml, 'ItemSet');
	let skillSets = titledBlocks(xml, 'SkillSet');
	let configSets = titledBlocks(xml, 'ConfigSet');

	if (!itemSets.length) {
		const itemsBlock = extractBlocks(xml, 'Items')[0];
		if (itemsBlock) itemSets = [{ id: 'default-items', title: 'Default', block: itemsBlock }];
	}
	if (!skillSets.length) {
		const skillsBlock = extractBlocks(xml, 'Skills')[0];
		if (skillsBlock) skillSets = [{ id: 'default-skills', title: 'Default', block: skillsBlock }];
	}
	const configBlock = extractBlocks(xml, 'Config')[0];
	if (!configSets.length && configBlock) {
		configSets = [{ id: 'default-config', title: 'Default', block: configBlock }];
	}

	const availableLoadouts = (
		treeSpecs.length ? treeSpecs : fallbackLoadouts(itemSets, skillSets)
	).slice(0, MAX_STEPS);
	if (!availableLoadouts.length) {
		throw new Error('No usable loadouts, item sets, or skill sets were found in this build.');
	}

	const items = parseItems(xml);
	const stats = parseCharacterStats(buildBlock);
	const statsLoadoutIndex = activeLoadoutIndex(xml, allTreeSpecs, availableLoadouts);
	const activeConfigId = readAttribute(openingTag(configBlock ?? '', 'Config'), 'activeConfigSet');
	const fallbackConfigSet =
		configSets.find((configSet) => configSet.id === activeConfigId) ??
		(configSets.length === 1 ? configSets[0] : undefined);
	const buildConfiguration = parseBuildConfiguration(buildTag);
	const steps = availableLoadouts.map((loadout, index) =>
		createStep(
			loadout,
			index,
			itemSets,
			skillSets,
			configSets,
			fallbackConfigSet,
			buildConfiguration,
			items,
			index === statsLoadoutIndex ? stats : [],
			source.url,
			level,
			bandit
		)
	);
	const className = (
		readAttribute(buildTag, 'ascendClassName') ||
		readAttribute(buildTag, 'className') ||
		'Path of Building'
	).slice(0, 200);
	const treeVersion =
		readAttribute(openingTag(treeSpecs[0]?.block ?? '', 'Spec'), 'treeVersion') ||
		readAttribute(buildTag, 'targetVersion') ||
		'Imported';
	const notes = parseNotes(xml);
	const guide: BuildGuide = {
		id: `pobb-${source.id}`,
		name: `Imported ${className} build`,
		buildVersion: treeVersion.replaceAll('_', '.').slice(0, 100),
		className,
		level,
		sourceUrl: source.url,
		notes,
		steps
	};
	if (!isBuildGuide(guide)) {
		throw new Error(
			'This build contains data outside the supported baseline format and could not be imported safely.'
		);
	}

	return {
		guide,
		summary: {
			loadoutCount: steps.length,
			equipmentCount: steps.reduce((total, step) => total + (step.equipment?.length ?? 0), 0),
			gemCount: steps.reduce(
				(total, step) =>
					total + (step.gems?.reduce((stepTotal, group) => stepTotal + group.gems.length, 0) ?? 0),
				0
			),
			uniqueCount: steps.reduce((total, step) => total + step.uniques.length, 0),
			noteCount: notes.length
		}
	};
}

export async function importPobbBuild(
	url: string,
	fetcher: typeof fetch = fetch
): Promise<PobbImportResult> {
	const source = parsePobbUrl(url);
	if (!source) {
		throw new Error('Paste a full pobb.in link, for example https://pobb.in/your-build-id.');
	}

	const rawUrl = `http://pobb.in/${source.id}/raw`;
	const response = await fetcher(`https://r.jina.ai/${rawUrl}`, {
		headers: { Accept: 'text/plain' },
		credentials: 'omit'
	});
	if (!response.ok) {
		if (response.status === 429) {
			throw new Error('The public PoB reader is busy. Wait a moment and try this link again.');
		}
		if (response.status === 404) {
			throw new Error('That pobb.in build could not be found.');
		}
		throw new Error(`Could not read this pobb.in build (${response.status}).`);
	}

	return buildGuideFromPobCode(readerCode(await response.text()), source.url);
}
