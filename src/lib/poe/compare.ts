import type { GuideCharacterStat, GuideConfigurationValue, GuideStep } from '$lib/types/guide';

export type ConfigurationDifference = {
	name: string;
	label: string;
	current?: GuideConfigurationValue['value'];
	comparison?: GuideConfigurationValue['value'];
};

export type CharacterStatDifference = {
	name: string;
	label: string;
	current?: number;
	comparison?: number;
	kind: 'progression' | 'calculated';
};

const statOrder = [
	'FullDPS',
	'TotalDPS',
	'AverageHit',
	'Speed',
	'HitSpeed',
	'CritChance',
	'CritMultiplier',
	'TotalEHP',
	'PhysicalMaximumHitTaken',
	'FireMaximumHitTaken',
	'ColdMaximumHitTaken',
	'LightningMaximumHitTaken',
	'ChaosMaximumHitTaken',
	'Life',
	'EnergyShield',
	'Ward',
	'ManaUnreserved',
	'Armour',
	'Evasion',
	'PhysicalDamageReduction',
	'EffectiveBlockChance',
	'EffectiveSpellBlockChance',
	'EffectiveSpellSuppressionChance',
	'FireResist',
	'ColdResist',
	'LightningResist',
	'ChaosResist',
	'EffectiveMovementSpeedMod',
	'PowerCharges',
	'PowerChargesMax',
	'FrenzyCharges',
	'FrenzyChargesMax',
	'EnduranceCharges',
	'EnduranceChargesMax'
] as const;

const statLabels: Record<string, string> = {
	FullDPS: 'Full DPS',
	TotalDPS: 'Main skill DPS',
	AverageHit: 'Average hit',
	Speed: 'Cast rate',
	HitSpeed: 'Hit rate',
	CritChance: 'Critical strike chance',
	CritMultiplier: 'Critical strike multiplier',
	TotalEHP: 'Effective hit pool',
	PhysicalMaximumHitTaken: 'Physical max hit',
	FireMaximumHitTaken: 'Fire max hit',
	ColdMaximumHitTaken: 'Cold max hit',
	LightningMaximumHitTaken: 'Lightning max hit',
	ChaosMaximumHitTaken: 'Chaos max hit',
	Life: 'Life',
	EnergyShield: 'Energy shield',
	Ward: 'Ward',
	ManaUnreserved: 'Unreserved mana',
	Armour: 'Armour',
	Evasion: 'Evasion',
	PhysicalDamageReduction: 'Physical damage reduction',
	EffectiveBlockChance: 'Attack block',
	EffectiveSpellBlockChance: 'Spell block',
	EffectiveSpellSuppressionChance: 'Spell suppression',
	FireResist: 'Fire resistance',
	ColdResist: 'Cold resistance',
	LightningResist: 'Lightning resistance',
	ChaosResist: 'Chaos resistance',
	EffectiveMovementSpeedMod: 'Movement speed modifier',
	PowerCharges: 'Power charges',
	PowerChargesMax: 'Maximum power charges',
	FrenzyCharges: 'Frenzy charges',
	FrenzyChargesMax: 'Maximum frenzy charges',
	EnduranceCharges: 'Endurance charges',
	EnduranceChargesMax: 'Maximum endurance charges'
};

const configurationLabels: Record<string, string> = {
	bandit: 'Bandit choice',
	bloodSandStance: 'Blood and Sand stance',
	buffAdrenaline: 'Adrenaline active',
	conditionCritRecently: 'Critical strike recently',
	conditionEnemyChilled: 'Enemy is chilled',
	conditionEnemyColdExposure: 'Enemy has cold exposure',
	conditionEnemyFrozen: 'Enemy is frozen',
	conditionEnemyShocked: 'Enemy is shocked',
	conditionEnemyUnnerved: 'Enemy is unnerved',
	conditionKilledRecently: 'Killed recently',
	conditionLeeching: 'Leeching',
	conditionShatteredEnemyRecently: 'Shattered recently',
	conditionShockedEnemyRecently: 'Shocked recently',
	conditionStationary: 'Stationary',
	customMods: 'Custom modifiers',
	enemyIsBoss: 'Enemy boss type',
	frostShieldStages: 'Frost Shield stages',
	infusedChannellingInfusion: 'Infusion active',
	multiplierChannelling: 'Channelling stages',
	multiplierFrozenByYouSeconds: 'Enemy frozen duration',
	multiplierKilledRecently: 'Enemies killed recently',
	multiplierNonInstantSpellCastRecently: 'Non-instant spells cast recently',
	pantheonMajorGod: 'Major Pantheon',
	pantheonMinorGod: 'Minor Pantheon',
	useEnduranceCharges: 'Use endurance charges',
	useFrenzyCharges: 'Use frenzy charges',
	usePowerCharges: 'Use power charges'
};

const statMap = (stats: GuideCharacterStat[] | undefined) =>
	new Map((stats ?? []).map((stat) => [stat.name, stat.value]));

export function humanizePobIdentifier(value: string) {
	return value
		.replace(/^condition/u, '')
		.replace(/^multiplier/u, '')
		.replace(/([a-z\d])([A-Z])/gu, '$1 $2')
		.replaceAll('_', ' ')
		.trim()
		.replace(/^./u, (character) => character.toUpperCase());
}

export function compareCharacterStats(
	currentStep: GuideStep,
	comparisonStep: GuideStep
): CharacterStatDifference[] {
	const differences: CharacterStatDifference[] = [];
	const progression = [
		{
			name: 'CharacterLevel',
			label: 'Approximate level',
			current: currentStep.level,
			comparison: comparisonStep.level
		},
		{
			name: 'AllocatedPassivePoints',
			label: 'Allocated passive points',
			current: currentStep.allocatedPassivePoints,
			comparison: comparisonStep.allocatedPassivePoints
		}
	];

	for (const stat of progression) {
		if (stat.current !== stat.comparison) {
			differences.push({ ...stat, kind: 'progression' });
		}
	}

	const currentStats = statMap(currentStep.characterStats);
	const comparisonStats = statMap(comparisonStep.characterStats);
	for (const name of statOrder) {
		const current = currentStats.get(name);
		const comparison = comparisonStats.get(name);
		if (current === undefined && comparison === undefined) continue;
		if (current === comparison) continue;
		differences.push({
			name,
			label: statLabels[name] ?? humanizePobIdentifier(name),
			current,
			comparison,
			kind: 'calculated'
		});
	}

	return differences;
}

export function compareConfiguration(
	current: GuideConfigurationValue[] | undefined,
	comparison: GuideConfigurationValue[] | undefined
): ConfigurationDifference[] {
	const currentByName = new Map((current ?? []).map((value) => [value.name, value.value]));
	const comparisonByName = new Map((comparison ?? []).map((value) => [value.name, value.value]));
	const names = [...new Set([...currentByName.keys(), ...comparisonByName.keys()])].sort(
		(left, right) =>
			(configurationLabels[left] ?? humanizePobIdentifier(left)).localeCompare(
				configurationLabels[right] ?? humanizePobIdentifier(right)
			)
	);

	return names.flatMap((name) => {
		const currentValue = currentByName.get(name);
		const comparisonValue = comparisonByName.get(name);
		if (currentValue === comparisonValue) return [];
		return [
			{
				name,
				label: configurationLabels[name] ?? humanizePobIdentifier(name),
				...(currentByName.has(name) ? { current: currentValue } : {}),
				...(comparisonByName.has(name) ? { comparison: comparisonValue } : {})
			}
		];
	});
}

const percentStats = new Set([
	'CritChance',
	'PhysicalDamageReduction',
	'EffectiveBlockChance',
	'EffectiveSpellBlockChance',
	'EffectiveSpellSuppressionChance',
	'FireResist',
	'ColdResist',
	'LightningResist',
	'ChaosResist'
]);

const compactNumber = new Intl.NumberFormat('en-US', {
	notation: 'compact',
	maximumFractionDigits: 2
});

const regularNumber = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 2
});

export function formatCharacterStat(name: string, value: number | undefined) {
	if (value === undefined) return 'Not captured';
	if (name === 'CritMultiplier') return `${regularNumber.format(value)}×`;
	if (name === 'EffectiveMovementSpeedMod') return `${regularNumber.format(value * 100)}%`;
	if (percentStats.has(name)) return `${regularNumber.format(value)}%`;
	if (Math.abs(value) >= 10_000) return compactNumber.format(value);
	return regularNumber.format(value);
}

export function formatConfigurationValue(value: GuideConfigurationValue['value'] | undefined) {
	if (value === undefined) return 'Not set';
	if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
	if (typeof value === 'number') return regularNumber.format(value);
	return value || 'Empty';
}
