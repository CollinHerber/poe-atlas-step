import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { format } from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'src/lib/data/equipment.json');
const checkOnly = process.argv.includes('--check');
const userAgent = 'AtlasStep/0.1 (pobb.in equipment extraction)';

const builds = [
	{
		id: 'cd6A9tg8QjrJ',
		guideId: 'hybrid-crit-winter-orb',
		steps: [
			{ stepId: 'entering-maps', itemSetTitle: 'Entering maps' },
			{ stepId: 'early-game', itemSetTitle: 'Early game' },
			{ stepId: 'transition-mid-game', itemSetTitle: 'Mid game' },
			{ stepId: 'endgame-optional', itemSetTitle: 'Endgame Optional' },
			{ stepId: 'pcharge-stack', itemSetTitle: 'Pcharge Stack' },
			{ stepId: 'uber-pcharge', itemSetTitle: 'Uber Pcharge' }
		]
	}
];

const equipmentSlots = [
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
];

const slotOrder = new Map(equipmentSlots.map((slot, index) => [slot, index]));
const flaskBaseTypes = [
	'Divine Life Flask',
	'Eternal Mana Flask',
	'Diamond Flask',
	'Granite Flask',
	'Jade Flask',
	'Quartz Flask',
	'Quicksilver Flask',
	'Silver Flask'
];

const decodeXml = (value) =>
	value
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'")
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&amp;', '&');

const readAttribute = (tag, name) => {
	const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
	return match ? decodeXml(match[1]) : '';
};

const findItemSet = (xml, title) => {
	for (const match of xml.matchAll(/<ItemSet\b[^>]*>[\s\S]*?<\/ItemSet>/gu)) {
		const openingTag = match[0].match(/^<ItemSet\b[^>]*>/u)?.[0] ?? '';
		if (readAttribute(openingTag, 'title') === title) return match[0];
	}
	throw new Error(`Could not find ItemSet titled "${title}".`);
};

const cleanStat = (line) => line.replace(/\{[^}]*\}/gu, '').trim();

const implicitSource = (line, text) => {
	if (line.includes('{eater}')) return 'eater';
	if (line.includes('{exarch}')) return 'exarch';
	if (line.includes('{crafted}') && text.startsWith('Allocates ')) return 'anointment';
	if (line.includes('{crafted}')) return 'enchant';
	return 'base';
};

const appliesToVariant = (line, selectedVariant) => {
	const match = line.match(/\{variant:([^}]+)\}/u);
	if (!match) return true;
	if (!selectedVariant) return false;
	return match[1].split(',').includes(selectedVariant);
};

const parseItems = (xml) => {
	const items = new Map();

	for (const match of xml.matchAll(/<Item\b[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/Item>/gu)) {
		const lines = decodeXml(match[2].replace(/<[^>]+>/gu, ''))
			.split(/\r?\n/u)
			.map((line) => line.trim())
			.filter(Boolean);
		const rarityIndex = lines.findIndex((line) => line.startsWith('Rarity:'));
		if (rarityIndex < 0) continue;

		const rarity = lines[rarityIndex].slice('Rarity:'.length).trim();
		const name = lines[rarityIndex + 1];
		const baseType =
			rarity === 'MAGIC'
				? (flaskBaseTypes.find((candidate) => name.includes(candidate)) ?? name)
				: lines[rarityIndex + 2];
		if (!name || !baseType) throw new Error(`Item ${match[1]} is missing its name or base type.`);

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
		const modifierLines =
			implicitIndex < 0
				? []
				: lines.slice(implicitIndex + 1).filter((line) => appliesToVariant(line, selectedVariant));
		const implicits = modifierLines.slice(0, implicitCount).flatMap((line) => {
			const text = cleanStat(line);
			return text ? [{ text, source: implicitSource(line, text) }] : [];
		});
		const stats = modifierLines.slice(implicitCount).map(cleanStat).filter(Boolean);

		items.set(match[1], {
			name,
			baseType,
			rarity,
			...(Number.isFinite(levelRequirement) && levelRequirement > 0 ? { levelRequirement } : {}),
			...(implicits.length ? { implicits } : {}),
			stats
		});
	}

	return items;
};

const extractEquipment = (xml, items, step) => {
	const itemSet = findItemSet(xml, step.itemSetTitle);

	return [...itemSet.matchAll(/<Slot\b[^>]*>/gu)]
		.map((match) => ({
			slot: readAttribute(match[0], 'name'),
			itemId: readAttribute(match[0], 'itemId')
		}))
		.filter(({ slot, itemId }) => slotOrder.has(slot) && itemId && itemId !== '0')
		.sort((left, right) => slotOrder.get(left.slot) - slotOrder.get(right.slot))
		.map(({ slot, itemId }) => {
			const item = items.get(itemId);
			if (!item) throw new Error(`Slot "${slot}" references missing item ${itemId}.`);
			return { slot, ...item };
		});
};

const fetchBuildXml = async (buildId) => {
	const url = `https://pobb.in/${buildId}/raw`;
	const response = await fetch(url, {
		headers: {
			Accept: 'text/plain',
			'User-Agent': userAgent
		}
	});
	if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);

	const code = (await response.text()).trim().replaceAll('-', '+').replaceAll('_', '/');
	return inflateSync(Buffer.from(code, 'base64')).toString('utf8');
};

const extracted = {};

for (const build of builds) {
	const xml = await fetchBuildXml(build.id);
	const items = parseItems(xml);
	extracted[build.guideId] = {};

	for (const step of build.steps) {
		const equipment = extractEquipment(xml, items, step);
		extracted[build.guideId][step.stepId] = equipment;
		console.log(`${build.guideId}/${step.stepId}: ${equipment.length} equipped items`);
	}
}

const nextContents = await format(JSON.stringify(extracted), {
	parser: 'json',
	printWidth: 100,
	useTabs: true
});

if (checkOnly) {
	const currentContents = await readFile(outputPath, 'utf8');
	if (currentContents !== nextContents) {
		throw new Error('equipment.json does not match the configured pobb.in equipment sets.');
	}
	console.log('equipment.json matches the configured transition PoB.');
} else {
	await writeFile(outputPath, nextContents, 'utf8');
	console.log('Updated src/lib/data/equipment.json from the configured transition PoB.');
}
