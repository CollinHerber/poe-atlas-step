import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'static/data/unique-tiers.json');
const pageUrl = 'https://poeladder.com/uniques';
const apiUrl = 'https://poeladder.com/api/v1/uniques';
const source = 'https://poeladder.com/uniques';
const ladderIdentifier = 'ssf_standard';
const repository = process.env.GITHUB_REPOSITORY ?? 'local development';
const userAgent = `AtlasStep/0.1 (${repository}; static GitHub Pages unique tier snapshot)`;

const uniqueKey = (name, baseType) => `${name}|${baseType}`;

async function getText(url, headers = {}) {
	const response = await fetch(url, {
		headers: {
			Accept: 'text/html,application/javascript',
			'User-Agent': userAgent,
			...headers
		}
	});

	if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
	return response.text();
}

async function getPoELadderClientToken() {
	const page = await getText(pageUrl);
	const scriptPath = page.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/u)?.[1];
	if (!scriptPath) throw new Error('PoE Ladder client bundle was not found.');

	const bundleUrl = new URL(scriptPath, pageUrl).toString();
	const bundle = await getText(bundleUrl);
	const token = bundle.match(/REACT_APP_JWT\s*:\s*"([^"]+)"/u)?.[1];
	if (!token) throw new Error('PoE Ladder public client credential was not found.');

	return token;
}

async function updateTiers() {
	const token = await getPoELadderClientToken();
	const url = new URL(apiUrl);
	url.searchParams.set('status', 'active');
	url.searchParams.set('ladderIdentifier', ladderIdentifier);

	const response = await fetch(url, {
		headers: {
			Accept: 'application/json',
			'User-Agent': userAgent,
			'jwt-auth': token
		}
	});
	if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);

	const data = await response.json();
	if (!Array.isArray(data.uniques))
		throw new Error('PoE Ladder did not return a unique item list.');

	const tiers = {};
	for (const item of data.uniques) {
		if (
			typeof item.name !== 'string' ||
			typeof item.baseItem !== 'string' ||
			!Number.isInteger(item.tier) ||
			item.tier < 0 ||
			item.tier > 5
		) {
			continue;
		}

		const key = uniqueKey(item.name, item.baseItem);
		const entry = {
			name: item.name,
			baseType: item.baseItem,
			tier: item.tier,
			grouping: typeof item.grouping === 'string' ? item.grouping : `T${item.tier}`,
			category: typeof item.category === 'string' ? item.category : ''
		};

		if (!tiers[key] || entry.tier < tiers[key].tier) tiers[key] = entry;
	}

	const sortedTiers = Object.fromEntries(
		Object.entries(tiers).sort(([left], [right]) => left.localeCompare(right))
	);

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(
		outputPath,
		`${JSON.stringify(
			{
				fetchedAt: new Date().toISOString(),
				source,
				ladderIdentifier,
				tiers: sortedTiers
			},
			null,
			2
		)}\n`,
		'utf8'
	);

	console.log(
		`Updated tiers for ${Object.keys(sortedTiers).length} active uniques from PoE Ladder.`
	);
}

try {
	await updateTiers();
} catch (error) {
	try {
		await readFile(outputPath, 'utf8');
		console.warn(`Tier refresh failed; preserving the existing snapshot. ${error.message}`);
	} catch {
		throw error;
	}
}
