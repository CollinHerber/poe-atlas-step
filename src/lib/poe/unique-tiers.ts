import type { GuideUnique, UniqueTierEntry, UniqueTierSnapshot } from '$lib/types/guide';

export const uniqueTierLabel = (tier: number) => `T${tier}`;

export function findUniqueTier(
	snapshot: UniqueTierSnapshot | null,
	item: Pick<GuideUnique, 'name' | 'baseType'>
): UniqueTierEntry | undefined {
	if (!snapshot) return undefined;

	const exact = snapshot.tiers[`${item.name}|${item.baseType}`];
	if (exact) return exact;

	const baseUniqueName = item.name.replace(/^Foulborn\s+/u, '');
	if (baseUniqueName !== item.name) {
		return snapshot.tiers[`${baseUniqueName}|${item.baseType}`];
	}

	return undefined;
}

export function uniqueTierRarity(tier: number) {
	switch (tier) {
		case 0:
			return 'Extremely rare';
		case 1:
			return 'Very rare';
		case 2:
			return 'Rare';
		case 3:
			return 'Uncommon';
		case 4:
			return 'Common';
		default:
			return 'Very common';
	}
}

export function uniqueTierClass(tier: number) {
	switch (tier) {
		case 0:
			return 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200';
		case 1:
			return 'border-amber-300/40 bg-amber-300/10 text-amber-200';
		case 2:
			return 'border-orange-300/35 bg-orange-300/10 text-orange-200';
		case 3:
			return 'border-cyan-300/35 bg-cyan-300/10 text-cyan-200';
		case 4:
			return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200';
		default:
			return 'border-slate-600 bg-slate-800/70 text-slate-300';
	}
}
