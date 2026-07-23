import type { GuideGem, GuideGemColor } from '$lib/types/guide';

export type GemDisplayColor = GuideGemColor | 'unknown';

const knownGemColors: Record<string, GuideGemColor> = {
	ArcticArmour: 'green',
	Automation: 'blue',
	Discipline: 'blue',
	FleshAndStone: 'red',
	Frostbite: 'blue',
	Frostblink: 'blue',
	FrostShield: 'blue',
	HeraldOfIce: 'green',
	ImmortalCall: 'red',
	QuickGuard: 'red',
	ShieldCharge: 'red',
	SnipersMark: 'green',
	SummonFlameGolem: 'red',
	SummonIceGolem: 'green',
	SummonLightningGolem: 'blue',
	SummonStoneGolem: 'red',
	SupportArcaneSurge: 'blue',
	SupportCastWhenDamageTaken: 'red',
	SupportColdPenetration: 'blue',
	SupportEnlighten: 'green',
	SupportFasterAttacks: 'green',
	SupportFocusedChannelling: 'blue',
	SupportIceBite: 'green',
	SupportIncreasedCriticalDamage: 'blue',
	SupportIncreasedCriticalStrikes: 'blue',
	SupportInfusedChannelling: 'blue',
	SupportInspiration: 'red',
	SupportLesserMultipleProjectiles: 'green',
	SupportMomentum: 'green',
	SupportMoreDuration: 'red',
	SupportPowerChargeOnCritical: 'blue',
	SupportScornfulHerald: 'blue',
	TempestShield: 'blue',
	WinterOrb: 'blue',
	Zealotry: 'blue'
};

export const gemColorForId = (id: string): GuideGemColor | undefined => knownGemColors[id];

export const displayGemColor = (gem: GuideGem): GemDisplayColor =>
	gem.color ?? gemColorForId(gem.id) ?? 'unknown';
