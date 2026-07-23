import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const itemsPath = resolve(root, 'src/lib/data/unique-items.json');
const apiUrl = 'https://www.poewiki.net/w/api.php';
const repository = process.env.GITHUB_REPOSITORY ?? 'local development';
const userAgent = `AtlasStep/0.1 (${repository}; unique wiki route validation)`;

function collectWikiTitles(guides) {
	const titles = new Set();

	for (const steps of Object.values(guides)) {
		for (const items of Object.values(steps)) {
			for (const item of items) {
				titles.add(item.wikiTitle ?? item.name);
			}
		}
	}

	return [...titles].sort();
}

async function queryTitles(titles) {
	const url = new URL(apiUrl);
	url.searchParams.set('action', 'query');
	url.searchParams.set('format', 'json');
	url.searchParams.set('formatversion', '2');
	url.searchParams.set('redirects', '1');
	url.searchParams.set('titles', titles.join('|'));

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

const guides = JSON.parse(await readFile(itemsPath, 'utf8'));
const titles = collectWikiTitles(guides);
const missing = [];

for (let index = 0; index < titles.length; index += 50) {
	const response = await queryTitles(titles.slice(index, index + 50));
	for (const page of response.query?.pages ?? []) {
		if (page.missing) missing.push(page.title);
	}
}

if (missing.length) {
	throw new Error(
		`Missing PoE Wiki pages: ${missing.join(', ')}. Add or correct wikiTitle overrides in unique-items.json.`
	);
}

console.log(`Verified ${titles.length} canonical PoE Wiki item routes.`);
