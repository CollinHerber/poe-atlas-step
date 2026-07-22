import type { BuildGuide, GuideStep, TodoPhase } from '$lib/types/guide';

const todo = (id: string, text: string, phase: TodoPhase): GuideStep['todos'][number] => ({
	id,
	text,
	phase,
	done: false
});

export const PRIMARY_POB_URL = 'https://pobb.in/221_ZcVSEO7G';
export const TRANSITION_POB_URL = 'https://pobb.in/cd6A9tg8QjrJ';
export const MAXROLL_URL =
	'https://maxroll.gg/poe/build-guides/winter-orb-elementalist-league-starter';

export const sampleGuides: BuildGuide[] = [
	{
		id: 'mom-crit-winter-orb',
		name: 'MoM Crit Winter Orb',
		buildVersion: '3.28',
		className: 'Elementalist',
		level: 98,
		sourceUrl: PRIMARY_POB_URL,
		steps: [
			{
				id: 'level-80-uber-lab',
				title: 'Level 80 – Uber Lab',
				eyebrow: 'Foundation',
				description:
					'Use this checkpoint to stabilize the character, finish the campaign-to-map handoff, and make the fourth ascendancy feel earned instead of rushed.',
				todos: [
					todo(
						'80-open-loadout',
						'Open the Level 80 loadout and compare the passive tree',
						'during'
					),
					todo(
						'80-uber-lab',
						'Complete Uber Lab and confirm the final ascendancy choice',
						'during'
					),
					todo('80-gear-review', 'Review every gear slot and name the weakest one', 'during'),
					todo('80-map-plan', 'Write down the next ten Atlas objectives', 'before-next'),
					todo('80-upgrade', 'Finish one meaningful gear or gem upgrade', 'before-next')
				]
			},
			{
				id: 'midgame',
				title: 'Midgame',
				eyebrow: 'Atlas momentum',
				description:
					'Turn Atlas completion into a repeatable routine. Keep upgrades concrete and small enough that every session can move at least one checkbox.',
				todos: [
					todo('mid-tree', 'Compare the Midgame tree and note every respec', 'during'),
					todo('mid-atlas', 'Choose a first Atlas strategy and save the tree link', 'during'),
					todo('mid-budget', 'Set a currency target for the next upgrade', 'during'),
					todo('mid-complete', 'Finish the current Atlas completion milestone', 'before-next'),
					todo('mid-purchase', 'Buy or craft the upgrade you were saving for', 'before-next')
				]
			},
			{
				id: 'endgame-no-cluster',
				title: 'Endgame – No Cluster',
				eyebrow: 'Baseline endgame',
				description:
					'Build a dependable endgame baseline before paying for cluster jewels. This is the spot to prove the farming loop and eliminate unclear upgrade goals.',
				todos: [
					todo('end-no-tree', 'Match the no-cluster passive tree', 'during'),
					todo('end-no-pob', 'Compare your character in PoB against this loadout', 'during'),
					todo('end-no-farm', 'Run the farming strategy for a complete tracked set', 'during'),
					todo('end-no-list', 'List the exact cluster jewels and passives needed', 'before-next'),
					todo('end-no-budget', 'Reach the cluster transition budget', 'before-next')
				]
			},
			{
				id: 'endgame-cluster',
				title: 'Endgame – Cluster',
				eyebrow: 'Primary destination',
				description:
					'Complete the first build’s intended destination, then decide whether the power-charge transition is exciting enough to become the next project.',
				todos: [
					todo(
						'end-cluster-swap',
						'Install the cluster setup and finish the required respec',
						'during'
					),
					todo('end-cluster-gems', 'Review the final skill and support setup', 'during'),
					todo(
						'end-cluster-test',
						'Test the build in the content you actually want to farm',
						'during'
					),
					todo(
						'end-cluster-review',
						'Write a short keep / change / transition review',
						'before-next'
					),
					todo(
						'end-cluster-next',
						'Choose the next goal instead of stopping at Atlas completion',
						'before-next'
					)
				]
			}
		]
	},
	{
		id: 'hybrid-crit-winter-orb',
		name: 'Hybrid Crit Winter Orb',
		buildVersion: '3.28',
		className: 'Elementalist',
		level: 95,
		sourceUrl: TRANSITION_POB_URL,
		steps: [
			{
				id: 'entering-maps',
				title: 'Entering maps',
				eyebrow: 'Entry point',
				description:
					'Capture the mapping baseline represented by this build before changing its core pieces.',
				todos: [
					todo(
						'maps-compare',
						'Compare tree, skills, and gear with the Entering maps loadout',
						'during'
					),
					todo('maps-gaps', 'Turn every important mismatch into a checkbox', 'during'),
					todo('maps-ready', 'Clear the gaps that block comfortable mapping', 'before-next')
				]
			},
			{
				id: 'early-game',
				title: 'Early game',
				eyebrow: 'Stabilize',
				description: 'Consolidate the early upgrades and keep the next purchase visible.',
				todos: [
					todo('early-compare', 'Compare against the Early game loadout', 'during'),
					todo('early-target', 'Pick the weakest current slot', 'during'),
					todo('early-finish', 'Complete the selected slot upgrade', 'before-next')
				]
			},
			{
				id: 'transition-mid-game',
				title: 'Mid game',
				eyebrow: 'Build depth',
				description:
					'Use a repeatable farm to fund the larger mechanical upgrades in the transition build.',
				todos: [
					todo('trans-mid-compare', 'Compare against the Mid game loadout', 'during'),
					todo('trans-mid-farm', 'Track one complete farming set', 'during'),
					todo('trans-mid-buy', 'Finish the next planned purchase', 'before-next')
				]
			},
			{
				id: 'endgame-optional',
				title: 'Endgame Optional',
				eyebrow: 'Optional power',
				description:
					'Evaluate optional endgame pieces by impact, cost, and how much you enjoy the content that funds them.',
				todos: [
					todo('optional-list', 'Rank the optional upgrades by impact', 'during'),
					todo('optional-one', 'Complete the highest-value optional upgrade', 'during'),
					todo('optional-decision', 'Decide whether to start power-charge stacking', 'before-next')
				]
			},
			{
				id: 'pcharge-stack',
				title: 'Pcharge Stack',
				eyebrow: 'Major transition',
				description:
					'Treat the power-charge setup as a project: price it, stage it, and avoid a half-finished swap.',
				todos: [
					todo('pc-price', 'Price the complete power-charge transition', 'during'),
					todo('pc-parts', 'Acquire every mandatory transition piece', 'during'),
					todo('pc-swap', 'Complete and test the full swap', 'before-next')
				]
			},
			{
				id: 'uber-pcharge',
				title: 'Uber Pcharge',
				eyebrow: 'Aspirational',
				description:
					'The aspirational endpoint. Pick a challenge worth testing and stop upgrading only when the goal—not the checklist—is finished.',
				todos: [
					todo('uber-compare', 'Compare against the Uber Pcharge loadout', 'during'),
					todo('uber-goal', 'Choose the aspirational content target', 'during'),
					todo('uber-finish', 'Complete the league goal and record the result', 'before-next')
				]
			}
		]
	}
];

export const cloneGuide = (guide: BuildGuide): BuildGuide => structuredClone(guide);

export const findGuideByUrl = (url: string): BuildGuide | undefined => {
	const match = url.trim().match(/^https?:\/\/(?:www\.)?pobb\.in\/([A-Za-z0-9_-]+)\/?$/i);
	if (!match) return undefined;
	return sampleGuides.find((guide) => guide.sourceUrl.endsWith(`/${match[1]}`));
};
