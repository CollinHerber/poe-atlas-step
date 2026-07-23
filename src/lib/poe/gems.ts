import type { GuideGem, GuideGemGroup } from '$lib/types/guide';

export type GuideGemUpdate = {
	before: GuideGem;
	after: GuideGem;
};

export type GuideGemGroupChange = {
	key: string;
	slot: string;
	label?: string;
	previousLabel?: string;
	added: GuideGem[];
	removed: GuideGem[];
	updated: GuideGemUpdate[];
	enabledBefore?: boolean;
	enabledAfter?: boolean;
};

type IndexedGroup = GuideGemGroup & { key: string };

const indexGroups = (groups: GuideGemGroup[]): IndexedGroup[] => {
	const occurrences = new Map<string, number>();

	return groups.map((group) => {
		const occurrence = occurrences.get(group.slot) ?? 0;
		occurrences.set(group.slot, occurrence + 1);
		return { ...group, key: `${group.slot}:${occurrence}` };
	});
};

const indexGems = (gems: GuideGem[]) => {
	const occurrences = new Map<string, number>();

	return new Map(
		gems.map((gem) => {
			const occurrence = occurrences.get(gem.id) ?? 0;
			occurrences.set(gem.id, occurrence + 1);
			return [`${gem.id}:${occurrence}`, gem] as const;
		})
	);
};

const gemChanged = (before: GuideGem, after: GuideGem) =>
	before.name !== after.name ||
	before.level !== after.level ||
	before.quality !== after.quality ||
	before.enabled !== after.enabled ||
	before.support !== after.support;

export function diffGemGroups(
	previousGroups: GuideGemGroup[],
	currentGroups: GuideGemGroup[]
): GuideGemGroupChange[] {
	const previous = indexGroups(previousGroups);
	const current = indexGroups(currentGroups);
	const previousByKey = new Map(previous.map((group) => [group.key, group]));
	const currentByKey = new Map(current.map((group) => [group.key, group]));
	const orderedKeys = [
		...current.map((group) => group.key),
		...previous.filter((group) => !currentByKey.has(group.key)).map((group) => group.key)
	];

	return orderedKeys.flatMap((key) => {
		const beforeGroup = previousByKey.get(key);
		const afterGroup = currentByKey.get(key);
		const beforeGems = indexGems(beforeGroup?.gems ?? []);
		const afterGems = indexGems(afterGroup?.gems ?? []);
		const added = [...afterGems]
			.filter(([gemKey]) => !beforeGems.has(gemKey))
			.map(([, gem]) => gem);
		const removed = [...beforeGems]
			.filter(([gemKey]) => !afterGems.has(gemKey))
			.map(([, gem]) => gem);
		const updated = [...afterGems].flatMap(([gemKey, after]) => {
			const before = beforeGems.get(gemKey);
			return before && gemChanged(before, after) ? [{ before, after }] : [];
		});
		const groupStateChanged =
			beforeGroup !== undefined &&
			afterGroup !== undefined &&
			beforeGroup.enabled !== afterGroup.enabled;

		if (!added.length && !removed.length && !updated.length && !groupStateChanged) return [];

		return [
			{
				key,
				slot: afterGroup?.slot ?? beforeGroup?.slot ?? 'Skill group',
				...(afterGroup?.label ? { label: afterGroup.label } : {}),
				...(beforeGroup?.label ? { previousLabel: beforeGroup.label } : {}),
				added,
				removed,
				updated,
				enabledBefore: beforeGroup?.enabled,
				enabledAfter: afterGroup?.enabled
			}
		];
	});
}
