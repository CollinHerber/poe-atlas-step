import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'src/lib/data/gems.json');
const checkOnly = process.argv.includes('--check');
const userAgent = 'AtlasStep/0.1 (pobb.in gem group extraction)';

const builds = [
	{
		id: 'cd6A9tg8QjrJ',
		guideId: 'hybrid-crit-winter-orb',
		steps: [
			{ stepId: 'entering-maps', skillSetTitle: 'Entering maps' },
			{ stepId: 'early-game', skillSetTitle: 'Early game' },
			{ stepId: 'transition-mid-game', skillSetTitle: 'Mid game' },
			{ stepId: 'endgame-optional', skillSetTitle: 'Endgame Optional' },
			{ stepId: 'pcharge-stack', skillSetTitle: 'Pcharge Stack' },
			{ stepId: 'uber-pcharge', skillSetTitle: 'Uber Pcharge' }
		]
	}
];

const gemColors = new Map([
	['ArcticArmour', 'green'],
	['Automation', 'blue'],
	['Discipline', 'blue'],
	['FleshAndStone', 'red'],
	['Frostbite', 'blue'],
	['Frostblink', 'blue'],
	['FrostShield', 'blue'],
	['HeraldOfIce', 'green'],
	['ImmortalCall', 'red'],
	['QuickGuard', 'red'],
	['ShieldCharge', 'red'],
	['SnipersMark', 'green'],
	['SummonFlameGolem', 'red'],
	['SummonIceGolem', 'green'],
	['SummonLightningGolem', 'blue'],
	['SummonStoneGolem', 'red'],
	['SupportArcaneSurge', 'blue'],
	['SupportCastWhenDamageTaken', 'red'],
	['SupportColdPenetration', 'blue'],
	['SupportEnlighten', 'green'],
	['SupportFasterAttacks', 'green'],
	['SupportFocusedChannelling', 'blue'],
	['SupportIceBite', 'green'],
	['SupportIncreasedCriticalDamage', 'blue'],
	['SupportIncreasedCriticalStrikes', 'blue'],
	['SupportInfusedChannelling', 'blue'],
	['SupportInspiration', 'red'],
	['SupportLesserMultipleProjectiles', 'green'],
	['SupportMomentum', 'green'],
	['SupportMoreDuration', 'red'],
	['SupportPowerChargeOnCritical', 'blue'],
	['SupportScornfulHerald', 'blue'],
	['TempestShield', 'blue'],
	['WinterOrb', 'blue'],
	['Zealotry', 'blue']
]);

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

const readBooleanAttribute = (tag, name, fallback = true) => {
	const value = readAttribute(tag, name);
	return value ? value === 'true' : fallback;
};

const readNumberAttribute = (tag, name) => {
	const value = Number(readAttribute(tag, name));
	return Number.isFinite(value) ? value : 0;
};

const humanizeIdentifier = (value) =>
	value
		.replace(/^Support/u, '')
		.replace(/([a-z\d])([A-Z])/gu, '$1 $2')
		.trim();

const findSkillSet = (xml, title) => {
	for (const match of xml.matchAll(/<SkillSet\b(?![^>]*\/>)[^>]*>[\s\S]*?<\/SkillSet>/gu)) {
		const openingTag = match[0].match(/^<SkillSet\b[^>]*>/u)?.[0] ?? '';
		if (readAttribute(openingTag, 'title') === title) return match[0];
	}
	throw new Error(`Could not find SkillSet titled "${title}".`);
};

const parseGem = (tag) => {
	const gemId = readAttribute(tag, 'gemId');
	const variantId = readAttribute(tag, 'variantId');
	const skillId = readAttribute(tag, 'skillId');
	const name =
		readAttribute(tag, 'nameSpec') ||
		humanizeIdentifier(variantId || skillId || gemId.split('/').at(-1) || '');
	const id = variantId || skillId || gemId || name;
	const color = gemColors.get(id);

	if (!name) throw new Error(`Gem is missing a usable name: ${tag}`);
	if (!color) throw new Error(`Gem "${name}" (${id}) is missing an in-game socket color.`);

	return {
		id,
		name,
		color,
		level: readNumberAttribute(tag, 'level'),
		quality: readNumberAttribute(tag, 'quality'),
		enabled: readBooleanAttribute(tag, 'enabled'),
		support: gemId.includes('/SupportGem')
	};
};

const extractGemGroups = (skillSet) => {
	const groups = [];

	for (const match of skillSet.matchAll(/<Skill\b[^>]*>[\s\S]*?<\/Skill>/gu)) {
		const openingTag = match[0].match(/^<Skill\b[^>]*>/u)?.[0] ?? '';
		const gems = [...match[0].matchAll(/<Gem\b[^>]*\/>/gu)].map((gem) => parseGem(gem[0]));
		if (!gems.length) continue;

		const slot = readAttribute(openingTag, 'slot') || 'Granted skill';
		const label = readAttribute(openingTag, 'label');
		groups.push({
			slot,
			...(label ? { label } : {}),
			enabled: readBooleanAttribute(openingTag, 'enabled'),
			gems
		});
	}

	return groups;
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
	extracted[build.guideId] = {};

	for (const step of build.steps) {
		const groups = extractGemGroups(findSkillSet(xml, step.skillSetTitle));
		extracted[build.guideId][step.stepId] = groups;
		const gemCount = groups.reduce((total, group) => total + group.gems.length, 0);
		console.log(`${build.guideId}/${step.stepId}: ${groups.length} groups, ${gemCount} gems`);
	}
}

const nextContents = `${JSON.stringify(extracted, null, '\t')}\n`;

if (checkOnly) {
	const currentContents = await readFile(outputPath, 'utf8');
	if (currentContents !== nextContents) {
		throw new Error('gems.json does not match the skill sets in the configured pobb.in loadouts.');
	}
	console.log('gems.json matches the configured transition PoB.');
} else {
	await writeFile(outputPath, nextContents, 'utf8');
	console.log('Updated src/lib/data/gems.json from the configured transition PoB.');
}
