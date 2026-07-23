import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const itemsPath = resolve(root, 'src/lib/data/unique-items.json');
const outputPath = resolve(root, 'static/data/poe-ninja-prices.json');
const apiRoot = 'https://poe.ninja/poe1/api/economy';
const source = 'https://poe.ninja/';
const repository = process.env.GITHUB_REPOSITORY ?? 'local development';
const userAgent = `AtlasStep/0.1 (${repository}; static GitHub Pages price snapshot)`;
const uniqueCategories = [
	'UniqueWeapon',
	'UniqueArmour',
	'UniqueAccessory',
	'UniqueFlask',
	'UniqueJewel'
];

const uniquePriceKey = (name, baseType) => `${name}|${baseType}`;
const normalize = (value) =>
	String(value ?? '')
		.trim()
		.toLocaleLowerCase('en-US');

async function getJson(url) {
	const response = await fetch(url, {
		headers: {
			Accept: 'application/json',
			'User-Agent': userAgent
		}
	});

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText} from ${url}`);
	}

	return response.json();
}

function collectTargets(guides) {
	const targets = new Map();

	for (const steps of Object.values(guides)) {
		for (const items of Object.values(steps)) {
			for (const item of items) {
				targets.set(uniquePriceKey(item.name, item.baseType), item);
			}
		}
	}

	return [...targets.values()];
}

function matchesTarget(line, target) {
	if (normalize(line.baseType) !== normalize(target.baseType)) return false;

	const possibleNames = [line.name];
	if (line.variant) possibleNames.push(`${line.variant} ${line.name}`);

	return possibleNames.some((name) => normalize(name) === normalize(target.name));
}

function selectPriceLine(lines, target) {
	const candidates = lines.filter((line) => matchesTarget(line, target));
	const uncorrupted = candidates.filter((line) => !line.corrupted);
	const pool = uncorrupted.length ? uncorrupted : candidates;

	return pool.sort(
		(a, b) =>
			Number(b.listingCount ?? 0) - Number(a.listingCount ?? 0) ||
			Number(a.links ?? 0) - Number(b.links ?? 0)
	)[0];
}

function preferPriceLine(current, candidate) {
	if (!current) return candidate;
	if (Boolean(current.corrupted) !== Boolean(candidate.corrupted)) {
		return candidate.corrupted ? current : candidate;
	}

	return Number(candidate.listingCount ?? candidate.count ?? 0) >
		Number(current.listingCount ?? current.count ?? 0)
		? candidate
		: current;
}

function serializePrice(line, name, baseType, category) {
	return {
		name,
		baseType,
		category,
		chaosValue: Number(line.chaosValue ?? 0),
		divineValue: Number(line.divineValue ?? 0),
		listingCount: Number(line.listingCount ?? line.count ?? 0),
		...(line.icon ? { icon: line.icon } : {}),
		...(line.variant ? { variant: line.variant } : {}),
		...(line.detailsId ? { detailsId: line.detailsId } : {})
	};
}

async function updatePrices() {
	const guides = JSON.parse(await readFile(itemsPath, 'utf8'));
	const targets = collectTargets(guides);
	const leagues = await getJson(`${apiRoot}/leagues`);
	const league = leagues[0]?.id;

	if (!league) throw new Error('poe.ninja did not return an active Path of Exile league.');

	const linesByCategory = new Map();
	for (const category of uniqueCategories) {
		const url = new URL(`${apiRoot}/stash/current/item/overview`);
		url.searchParams.set('league', league);
		url.searchParams.set('type', category);
		const response = await getJson(url);
		linesByCategory.set(category, response.lines ?? []);
	}

	const prices = {};
	const missing = [];

	for (const [category, lines] of linesByCategory) {
		const selectedLines = new Map();
		for (const line of lines) {
			if (!line.name || !line.baseType) continue;
			const key = uniquePriceKey(line.name, line.baseType);
			selectedLines.set(key, preferPriceLine(selectedLines.get(key), line));
		}

		for (const [key, line] of selectedLines) {
			prices[key] = serializePrice(line, line.name, line.baseType, category);
		}
	}

	// Preserve hand-authored names and aliases used by imported builds.
	for (const target of targets) {
		const line = selectPriceLine(linesByCategory.get(target.category) ?? [], target);
		const key = uniquePriceKey(target.name, target.baseType);

		if (!line) {
			missing.push(key);
			continue;
		}

		prices[key] = serializePrice(line, target.name, target.baseType, target.category);
	}

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(
		outputPath,
		`${JSON.stringify(
			{
				league,
				fetchedAt: new Date().toISOString(),
				source,
				prices,
				missing
			},
			null,
			2
		)}\n`,
		'utf8'
	);

	console.log(
		`Updated ${Object.keys(prices).length} unique prices for ${league}; ${targets.length - missing.length}/${targets.length} bundled items matched.`
	);
	if (missing.length) console.warn(`No price was found for: ${missing.join(', ')}`);
}

try {
	await updatePrices();
} catch (error) {
	if (process.env.POE_NINJA_REFRESH_REQUIRED === '1') {
		throw error;
	}

	try {
		await readFile(outputPath, 'utf8');
		console.warn(`Price refresh failed; preserving the existing snapshot. ${error.message}`);
	} catch {
		throw error;
	}
}
