import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'src/lib/data/unique-items.json');
const checkOnly = process.argv.includes('--check');
const userAgent = 'AtlasStep/0.1 (pobb.in equipped unique extraction)';

const builds = [
	{
		id: 'cd6A9tg8QjrJ',
		guideId: 'hybrid-crit-winter-orb',
		steps: [
			{ stepId: 'entering-maps', itemSetTitle: 'Entering maps', treeTitle: 'Entering maps' },
			{ stepId: 'early-game', itemSetTitle: 'Early game', treeTitle: 'Early game' },
			{
				stepId: 'transition-mid-game',
				itemSetTitle: 'Mid game',
				treeTitle: 'Mid game'
			},
			{
				stepId: 'endgame-optional',
				itemSetTitle: 'Endgame Optional',
				treeTitle: 'Endgame Optional'
			},
			{
				stepId: 'pcharge-stack',
				itemSetTitle: 'Pcharge Stack',
				treeTitle: 'Pcharge Stack'
			},
			{
				stepId: 'uber-pcharge',
				itemSetTitle: 'Uber Pcharge',
				treeTitle: 'Uber Pcharge'
			}
		]
	}
];

const equipmentSlotPattern =
	/^(Weapon [12]|Helmet|Body Armour|Gloves|Boots|Amulet|Ring [12]|Belt|Flask [1-5])$/u;

const slotOrder = new Map(
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

const wikiTitleOverrides = new Map([['Foulborn The Pandemonius', 'The Pandemonius']]);

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

const findTitledBlock = (xml, tagName, title) => {
	const expression = new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?</${tagName}>`, 'gu');
	for (const match of xml.matchAll(expression)) {
		const openingTag = match[0].match(new RegExp(`^<${tagName}\\b[^>]*>`))?.[0] ?? '';
		if (readAttribute(openingTag, 'title') === title) return match[0];
	}
	throw new Error(`Could not find ${tagName} titled "${title}".`);
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
		const baseType = lines[rarityIndex + 2];
		if (!name || !baseType) throw new Error(`Item ${match[1]} is missing its name or base type.`);

		items.set(match[1], { rarity, name, baseType });
	}

	return items;
};

const normalizeUniqueName = (name, baseType) =>
	baseType === 'Timeless Jewel' ? name.replace(/\s+\[[^\]]+\]$/u, '') : name;

const categoryFor = (slot, baseType) => {
	if (slot.startsWith('Jewel ')) return 'UniqueJewel';
	if (slot.startsWith('Flask ')) return 'UniqueFlask';
	if (['Amulet', 'Ring 1', 'Ring 2', 'Belt'].includes(slot)) return 'UniqueAccessory';
	if (['Helmet', 'Body Armour', 'Gloves', 'Boots'].includes(slot)) return 'UniqueArmour';
	if (/Shield$/u.test(baseType)) return 'UniqueArmour';
	return 'UniqueWeapon';
};

const compareSlots = (left, right) => {
	const leftOrder = slotOrder.get(left.slot) ?? 100 + Number(left.slot.split(' ')[1] ?? 0);
	const rightOrder = slotOrder.get(right.slot) ?? 100 + Number(right.slot.split(' ')[1] ?? 0);
	return leftOrder - rightOrder || left.slot.localeCompare(right.slot);
};

const collectReferences = (itemSet, tree) => {
	const references = [];

	for (const match of itemSet.matchAll(/<Slot\b[^>]*>/gu)) {
		const slot = readAttribute(match[0], 'name');
		const itemId = readAttribute(match[0], 'itemId');
		if (equipmentSlotPattern.test(slot) && itemId && itemId !== '0') {
			references.push({ slot, itemId });
		}
	}

	for (const match of tree.matchAll(/<Socket\b[^>]*>/gu)) {
		const nodeId = readAttribute(match[0], 'nodeId');
		const itemId = readAttribute(match[0], 'itemId');
		if (nodeId && itemId && itemId !== '0') {
			references.push({ slot: `Jewel ${nodeId}`, itemId });
		}
	}

	return references.sort(compareSlots);
};

const extractStepUniques = (xml, items, step) => {
	const itemSet = findTitledBlock(xml, 'ItemSet', step.itemSetTitle);
	const tree = findTitledBlock(xml, 'Spec', step.treeTitle);

	return collectReferences(itemSet, tree)
		.map(({ slot, itemId }) => {
			const item = items.get(itemId);
			if (!item) throw new Error(`Slot "${slot}" references missing item ${itemId}.`);
			return { slot, ...item };
		})
		.filter((item) => item.rarity === 'UNIQUE')
		.map(({ slot, name: rawName, baseType }) => {
			const name = normalizeUniqueName(rawName, baseType);
			const wikiTitle = wikiTitleOverrides.get(name);
			return {
				name,
				baseType,
				slot: slot.startsWith('Jewel ') ? 'Jewel' : slot,
				category: categoryFor(slot, baseType),
				...(wikiTitle ? { wikiTitle } : {})
			};
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
		const uniques = extractStepUniques(xml, items, step);
		extracted[build.guideId][step.stepId] = uniques;
		console.log(`${build.guideId}/${step.stepId}: ${uniques.length} equipped uniques`);
	}
}

const nextContents = `${JSON.stringify(extracted, null, '\t')}\n`;

if (checkOnly) {
	const currentContents = await readFile(outputPath, 'utf8');
	if (currentContents !== nextContents) {
		throw new Error(
			'unique-items.json does not match the equipped items in the configured pobb.in loadouts.'
		);
	}
	console.log('unique-items.json matches the configured transition PoB.');
} else {
	await writeFile(outputPath, nextContents, 'utf8');
	console.log('Updated src/lib/data/unique-items.json from the configured transition PoB.');
}
