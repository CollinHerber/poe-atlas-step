import type { GuideEquipmentItem } from '$lib/types/guide';

export type EquipmentChange = {
	slot: string;
	kind: 'added' | 'removed' | 'replaced' | 'updated';
	before?: GuideEquipmentItem;
	after?: GuideEquipmentItem;
};

export type EquipmentModifierComparison = {
	text: string;
	previousText?: string;
	tone: 'same' | 'higher' | 'lower' | 'added' | 'removed' | 'changed';
};

const rareSlotPriorities: Record<string, string[]> = {
	'Weapon 1': [
		'+cold/spell gem levels',
		'Cast speed',
		'Spell or cold damage',
		'Spell critical chance'
	],
	'Weapon 2': [
		'Maximum Life or Energy Shield',
		'+cold spell levels',
		'Spell critical chance or block',
		'Resistances'
	],
	Helmet: [
		'Maximum Life or Energy Shield',
		'Resistances',
		'Cast speed implicit',
		'Physical damage taken as elemental'
	],
	'Body Armour': [
		'Maximum Life or Energy Shield',
		'High Armour/ES base',
		'Resistances',
		'Physical damage taken as elemental'
	],
	Gloves: [
		'Maximum Life or Energy Shield',
		'Resistances',
		'Cold Exposure on Hit',
		'Unnerve or freeze proliferation'
	],
	Boots: ['Movement speed', 'Maximum Life or Energy Shield', 'Resistances', 'Ailment immunity'],
	Amulet: [
		'+cold or Winter Orb levels',
		'Critical strike multiplier',
		'Maximum Life or Energy Shield',
		'Required attributes'
	],
	'Ring 1': ['Cast speed', 'Maximum Life or Energy Shield', 'Resistances', 'Required attributes'],
	'Ring 2': ['Cast speed', 'Maximum Life or Energy Shield', 'Resistances', 'Required attributes'],
	Belt: ['Maximum Life or Energy Shield', 'Resistances', 'Strength or attributes', 'Flask utility']
};

const uniquePriorities: Record<string, string[]> = {
	'Mystic Refractor': ['Additional projectiles', 'Projectile speed', 'Cold damage roll'],
	'Dying Sun': ['Additional projectiles', 'Area of effect', 'Flask uptime'],
	'Foulborn The Pandemonius': ['Cold penetration', 'Chill and blind utility', 'Cold damage'],
	'Death Rush': ['Adrenaline uptime', 'Chaos resistance', 'Life recovery on kill'],
	"Rumi's Concoction": ['Attack and spell block', 'Armour', 'Flask uptime'],
	'Light of Lunaris': ['Critical multiplier', 'Spell critical chance', 'Energy Shield'],
	"Replica Dragonfang's Flight": ['+3 to Winter Orb', 'Reservation efficiency', 'Attribute rolls'],
	'Badge of the Brotherhood': ['Frenzy-charge scaling', 'Cooldown recovery', 'Attribute rolls'],
	Willclash: ['Spell block per power charge', 'Spell damage', 'Energy Shield'],
	Tulfall: ['Maximum power charges', 'Cold damage per charge', 'Charge synergy'],
	"Malachai's Loop": ['Maximum power charges', 'Spell damage', 'Charge interaction'],
	"Romira's Banquet": ['Power-charge generation', 'Critical scaling synergy', 'Useful corruption'],
	"Graven's Secret": ['Absorption-charge effect', 'Energy Shield', 'Resistance roll'],
	"Ralakesh's Impatience": ['Charge floor effect', 'Movement speed', 'Useful corruption']
};

const flaskPriorities: Record<string, string[]> = {
	'Divine Life Flask': ['Instant recovery', 'Bleed/Corrupted Blood answer', '20% quality'],
	'Eternal Mana Flask': ['Enduring recovery', 'Charges or duration', '20% quality'],
	'Diamond Flask': ['Critical chance suffix', 'Reliable charge gain', 'Effect uptime'],
	'Quicksilver Flask': ['Movement speed', 'Duration or charges', 'Effect uptime'],
	'Granite Flask': ['Armour suffix', 'Charges when hit', 'Effect uptime'],
	'Jade Flask': ['Evasion suffix', 'Duration or charges', 'Effect uptime'],
	'Quartz Flask': ['Useful utility suffix', 'Charges when hit', 'Effect uptime'],
	'Silver Flask': ['Onslaught uptime', 'Useful utility suffix', 'Duration or charges']
};

const checkpointPriorities: Record<string, string[]> = {
	'entering-maps': [
		'Cap elemental resistances',
		'Build Life and Energy Shield',
		'Meet attribute requirements',
		'Prioritize cast speed before luxury damage'
	],
	'early-game': [
		'Keep resistances capped',
		'Repair Life and Energy Shield',
		'Add cast speed',
		'Upgrade only the weakest slot'
	],
	'transition-mid-game': [
		'Keep defenses and attributes solved',
		'Add cast speed',
		'Progress the amulet',
		'Buy projectiles only after the basics'
	],
	'endgame-optional': [
		'Buy one high-impact upgrade at a time',
		'Preserve Energy Shield and resistances',
		'Prioritize critical multiplier',
		'Finish the CI checklist before charge stacking'
	],
	'pcharge-stack': [
		'Acquire the complete charge package',
		'Build the Energy Shield shell',
		'Solve resistances and ailments',
		'Scale critical multiplier per charge'
	],
	'uber-pcharge': [
		'Finish the complete charge package',
		'Maximize Energy Shield',
		'Finish ailment immunity',
		'Polish charge and critical scaling'
	]
};

export function getEquipmentPriorities(item: GuideEquipmentItem) {
	if (item.rarity === 'UNIQUE') {
		return (
			uniquePriorities[item.name] ?? [
				'Build-enabling unique effect',
				'Useful roll values',
				'Relevant corruption later'
			]
		);
	}

	if (item.slot.startsWith('Flask ')) {
		return (
			flaskPriorities[item.baseType] ?? [
				'Useful base effect',
				'Reliable uptime',
				'Defensive suffix'
			]
		);
	}

	return (
		rareSlotPriorities[item.slot] ?? [
			'Maximum Life or Energy Shield',
			'Resistances',
			'Required attributes'
		]
	);
}

export function getCheckpointPriorities(stepId: string) {
	return (
		checkpointPriorities[stepId] ?? [
			'Cap elemental resistances',
			'Build Life or Energy Shield',
			'Meet attribute requirements',
			'Add cast speed'
		]
	);
}

const itemSignature = (item: GuideEquipmentItem) =>
	JSON.stringify({
		name: item.name,
		baseType: item.baseType,
		rarity: item.rarity,
		levelRequirement: item.levelRequirement,
		implicits: item.implicits,
		stats: item.stats
	});

export const equipmentModifierLines = (item: GuideEquipmentItem | undefined) =>
	item ? [...(item.implicits ?? []).map((implicit) => implicit.text), ...item.stats] : [];

const modifierNumbers = (line: string) =>
	[...line.matchAll(/[+-]?\d+(?:\.\d+)?/gu)].map((match) => Number(match[0]));

const modifierSignature = (line: string) =>
	line
		.toLowerCase()
		.replace(/[+-]?\d+(?:\.\d+)?/gu, '#')
		.replace(/\s+/gu, ' ')
		.trim();

const compareModifierValues = (
	before: string,
	after: string
): EquipmentModifierComparison['tone'] => {
	if (before === after) return 'same';
	const beforeNumbers = modifierNumbers(before);
	const afterNumbers = modifierNumbers(after);
	if (!beforeNumbers.length || beforeNumbers.length !== afterNumbers.length) return 'changed';

	const differences = afterNumbers.map((value, index) => value - beforeNumbers[index]);
	if (differences.every((difference) => difference >= 0) && differences.some(Boolean)) {
		return 'higher';
	}
	if (differences.every((difference) => difference <= 0) && differences.some(Boolean)) {
		return 'lower';
	}

	const beforeAverage =
		beforeNumbers.reduce((total, value) => total + value, 0) / beforeNumbers.length;
	const afterAverage =
		afterNumbers.reduce((total, value) => total + value, 0) / afterNumbers.length;
	if (afterAverage > beforeAverage) return 'higher';
	if (afterAverage < beforeAverage) return 'lower';
	return 'changed';
};

export function compareEquipmentModifiers(
	before: GuideEquipmentItem | undefined,
	after: GuideEquipmentItem | undefined
): EquipmentModifierComparison[] {
	const beforeLines = equipmentModifierLines(before);
	const afterLines = equipmentModifierLines(after);
	const beforeBySignature = new Map<string, Array<{ index: number; text: string }>>();

	for (const [index, text] of beforeLines.entries()) {
		const signature = modifierSignature(text);
		const matches = beforeBySignature.get(signature) ?? [];
		matches.push({ index, text });
		beforeBySignature.set(signature, matches);
	}

	const matchedBefore = new Set<number>();
	const comparisons = afterLines.map((text): EquipmentModifierComparison => {
		const match = beforeBySignature
			.get(modifierSignature(text))
			?.find((candidate) => !matchedBefore.has(candidate.index));
		if (!match) return { text, tone: 'added' };
		matchedBefore.add(match.index);
		return {
			text,
			previousText: match.text,
			tone: compareModifierValues(match.text, text)
		};
	});

	for (const [index, text] of beforeLines.entries()) {
		if (!matchedBefore.has(index)) {
			comparisons.push({
				text: `Missing: ${text}`,
				previousText: text,
				tone: 'removed'
			});
		}
	}

	return comparisons;
}

export function diffEquipment(
	previousItems: GuideEquipmentItem[],
	currentItems: GuideEquipmentItem[]
): EquipmentChange[] {
	const previousBySlot = new Map(previousItems.map((item) => [item.slot, item]));
	const currentBySlot = new Map(currentItems.map((item) => [item.slot, item]));
	const slots = [
		...currentItems.map((item) => item.slot),
		...previousItems.filter((item) => !currentBySlot.has(item.slot)).map((item) => item.slot)
	];

	const changes: EquipmentChange[] = [];

	for (const slot of slots) {
		const before = previousBySlot.get(slot);
		const after = currentBySlot.get(slot);
		if (!before && after) {
			changes.push({ slot, kind: 'added', after });
			continue;
		}
		if (before && !after) {
			changes.push({ slot, kind: 'removed', before });
			continue;
		}
		if (!before || !after || itemSignature(before) === itemSignature(after)) continue;
		const sameItem = before.name === after.name && before.baseType === after.baseType;
		changes.push({ slot, kind: sameItem ? 'updated' : 'replaced', before, after });
	}

	return changes;
}
