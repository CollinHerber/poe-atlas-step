import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = resolve(root, 'static/data/poe-ninja-prices.json');
const expectedCategories = new Set([
	'UniqueWeapon',
	'UniqueArmour',
	'UniqueAccessory',
	'UniqueFlask',
	'UniqueJewel'
]);
const minimumCatalogSize = 500;

const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const prices = snapshot?.prices;

if (!snapshot || typeof snapshot !== 'object') {
	throw new Error('The poe.ninja snapshot must be an object.');
}

if (typeof snapshot.league !== 'string' || !snapshot.league.trim()) {
	throw new Error('The poe.ninja snapshot is missing its league.');
}

if (
	typeof snapshot.fetchedAt !== 'string' ||
	Number.isNaN(new Date(snapshot.fetchedAt).getTime())
) {
	throw new Error('The poe.ninja snapshot has an invalid fetchedAt timestamp.');
}

if (!prices || typeof prices !== 'object' || Array.isArray(prices)) {
	throw new Error('The poe.ninja snapshot is missing its price catalog.');
}

const entries = Object.entries(prices);
if (entries.length < minimumCatalogSize) {
	throw new Error(
		`The snapshot contains only ${entries.length} prices; expected at least ${minimumCatalogSize} full-catalog entries.`
	);
}

const foundCategories = new Set();
for (const [key, price] of entries) {
	if (!price || typeof price !== 'object') {
		throw new Error(`Invalid price entry at ${key}.`);
	}

	if (`${price.name}|${price.baseType}` !== key) {
		throw new Error(`Price key does not match its item at ${key}.`);
	}

	if (!expectedCategories.has(price.category)) {
		throw new Error(`Unknown poe.ninja category ${price.category} at ${key}.`);
	}

	if (
		!Number.isFinite(price.chaosValue) ||
		!Number.isFinite(price.divineValue) ||
		!Number.isFinite(price.listingCount)
	) {
		throw new Error(`Invalid market values at ${key}.`);
	}

	foundCategories.add(price.category);
}

const missingCategories = [...expectedCategories].filter(
	(category) => !foundCategories.has(category)
);
if (missingCategories.length) {
	throw new Error(`The snapshot is missing categories: ${missingCategories.join(', ')}.`);
}

console.log(
	`Validated ${entries.length} unique prices for ${snapshot.league} across all ${foundCategories.size} poe.ninja categories.`
);
