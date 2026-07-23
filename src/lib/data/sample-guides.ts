import equipmentItems from '$lib/data/equipment.json';
import gemGroups from '$lib/data/gems.json';
import uniqueItems from '$lib/data/unique-items.json';
import { primaryBuildNotes, transitionBuildNotes } from '$lib/data/build-notes';
import type {
	BuildGuide,
	GuideEquipmentItem,
	GuideGemGroup,
	GuideStep,
	GuideUnique,
	TodoPhase
} from '$lib/types/guide';

const todo = (id: string, text: string, phase: TodoPhase): GuideStep['todos'][number] => ({
	id,
	text,
	phase,
	done: false
});

const uniqueItemsByStep = uniqueItems as Record<string, Record<string, GuideUnique[]>>;
const equipmentItemsByStep = equipmentItems as Record<string, Record<string, GuideEquipmentItem[]>>;
const gemGroupsByStep = gemGroups as Record<string, Record<string, GuideGemGroup[]>>;

const uniques = (guideId: string, stepId: string): GuideUnique[] =>
	(uniqueItemsByStep[guideId]?.[stepId] ?? []).map((item) => ({ ...item }));

const equipment = (guideId: string, stepId: string): GuideEquipmentItem[] =>
	structuredClone(equipmentItemsByStep[guideId]?.[stepId] ?? []);

const gems = (guideId: string, stepId: string): GuideGemGroup[] =>
	structuredClone(gemGroupsByStep[guideId]?.[stepId] ?? []);

export const PRIMARY_POB_URL = 'https://pobb.in/221_ZcVSEO7G';
export const TRANSITION_POB_URL = 'https://pobb.in/cd6A9tg8QjrJ';
export const FUBGUN_GUIDE_URL = 'https://www.youtube.com/watch?v=--XDhqSlwPA';
export const ZIZARAN_GUIDE_URL = 'https://www.youtube.com/watch?v=OZypCJ-5Bog';
export const MAXROLL_URL =
	'https://maxroll.gg/poe/build-guides/winter-orb-elementalist-league-starter';

const atTime = (url: string, seconds: number) => `${url}&t=${seconds}s`;

export const sampleGuides: BuildGuide[] = [
	{
		id: 'mom-crit-winter-orb',
		name: 'MoM Crit Winter Orb',
		buildVersion: '3.28',
		className: 'Elementalist',
		level: 98,
		sourceUrl: PRIMARY_POB_URL,
		notes: primaryBuildNotes,
		steps: [
			{
				id: 'level-80-uber-lab',
				title: 'Level 80 – Uber Lab',
				eyebrow: 'Foundation',
				description:
					'Use this checkpoint to stabilize the character, finish the campaign-to-map handoff, and make the fourth ascendancy feel earned instead of rushed.',
				uniques: uniques('mom-crit-winter-orb', 'level-80-uber-lab'),
				equipment: equipment('mom-crit-winter-orb', 'level-80-uber-lab'),
				gems: gems('mom-crit-winter-orb', 'level-80-uber-lab'),
				noteHighlights: [
					'Finish the core golem trio, then choose the fourth golem to solve defense, critical chance, or chaos resistance.',
					'Use Bastion of Elements as the safe fourth ascendancy; take Shaper of Storms early only if you accept the defensive tradeoff.',
					'Keep Faster Casting until Lightning Golem and gear make Winter Orb ramp quickly enough, and test multiple-projectile supports in real maps.',
					'Check whether Bitter Frost is available in the 3.29 tree and remove Bonechill if the two effects are redundant.'
				],
				insights: [
					{
						title: 'Channel differently for clearing and bosses',
						body: 'Build stages, then move while Winter Orb clears around you. Re-channel before the buff expires. For single target, keep channeling: the skill gains 80% more projectile frequency while you hold it.',
						sourceLabel: 'Zizaran — mechanics, 1:32',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 92)
					},
					{
						title: 'Cast speed is what makes the build feel good',
						body: 'Cast speed shortens the time spent standing still and ramps Winter Orb faster. Start with a Profane Wand and at least one Moonstone Ring; Faster Casting can bridge the gap until Lightning Golem feels sufficient.',
						sourceLabel: 'Zizaran — notes and FAQ, 4:11',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 251)
					},
					{
						title: 'Energy Shield is part of your mana and defense',
						body: 'Eldritch Battery plus Mind Over Matter turns Energy Shield into a reliable casting buffer and another effective-health layer. Life, Energy Shield, capped resistances, and sustainable Winter Orb cost all matter together.',
						sourceLabel: 'Zizaran — solving mana, 7:42',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 462)
					},
					{
						title: 'Choose the fourth ascendancy for your situation',
						body: 'Bastion of Elements is the safer default while gear is weak. Softcore players can take Shaper of Storms earlier for damage; the guide later wants it to activate Stormrider in the cluster setup.',
						sourceLabel: 'Zizaran — ascendancy, 3:42',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 222)
					},
					{
						title: 'Projectiles are real damage, not just clear',
						body: 'Winter Orb projectiles can overlap. Until Mystic Refractor, Dying Sun, or another projectile breakpoint is online, test Multiple Projectiles or Greater Multiple Projectiles instead of trusting the tooltip.',
						sourceLabel: 'Fubgun — entering maps, 4:20',
						sourceUrl: atTime(FUBGUN_GUIDE_URL, 260)
					}
				],
				todos: [
					todo(
						'80-open-loadout',
						'Match the Level 80 passive tree and record every respec you still need',
						'during'
					),
					todo(
						'80-uber-lab',
						'Complete Uber Lab; choose Bastion of Elements or Shaper of Storms intentionally',
						'during'
					),
					todo(
						'80-cast-speed',
						'Equip a cast-speed foundation: Profane Wand plus at least one Moonstone Ring',
						'during'
					),
					todo(
						'80-defences',
						'Cap elemental resistances and fill life, Energy Shield, and attribute gaps',
						'during'
					),
					todo(
						'80-golems',
						'Run Flame, Lightning, and Stone Golems; choose the fourth for crit or defense',
						'during'
					),
					todo(
						'80-quality',
						'Prioritize Winter Orb socket quality and confirm your maximum stage count',
						'before-next'
					),
					todo(
						'80-play-test',
						'Clear ten maps while maintaining stages, then practice sustained boss channeling',
						'before-next'
					),
					todo(
						'80-projectiles',
						'Test the available projectile supports and keep the setup that feels best in maps',
						'before-next'
					),
					todo('80-map-plan', 'Write down the next ten Atlas objectives', 'before-next')
				]
			},
			{
				id: 'midgame',
				title: 'Midgame',
				eyebrow: 'Atlas momentum',
				description:
					'Turn Atlas completion into a repeatable routine. Keep upgrades concrete and small enough that every session can move at least one checkbox.',
				uniques: uniques('mom-crit-winter-orb', 'midgame'),
				equipment: equipment('mom-crit-winter-orb', 'midgame'),
				gems: gems('mom-crit-winter-orb', 'midgame'),
				noteHighlights: [
					'Prioritize cast speed before decorative damage: Profane Wand and a Moonstone Ring are the feel-good baseline.',
					'Keep Greater Multiple Projectiles until Mystic Refractor, Dying Sun, or gem levels supply enough projectiles, then re-test the socket.',
					'Treat four watchstones and a repeatable mapping strategy as success; this build is not intended to become an Uber farmer.'
				],
				insights: [
					{
						title: 'Mystic Refractor is powerful, not mandatory',
						body: 'Its three additional projectiles and projectile speed are excellent for Winter Orb overlap and clear. Keep using a rare cast-speed wand until the price is sensible; the build does not need the unique to enter maps.',
						sourceLabel: 'Fubgun — midgame setup, 14:24',
						sourceUrl: atTime(FUBGUN_GUIDE_URL, 864)
					},
					{
						title: 'The tooltip undervalues AoE and projectiles',
						body: 'More projectiles and Area of Effect create more overlaps, so real damage can improve without the tooltip showing it. Compare GMP, Multiple Projectiles, and a damage support in actual maps and bosses.',
						sourceLabel: 'Zizaran — notes and FAQ, 4:11',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 251)
					},
					{
						title: 'Cold Exposure is the first glove implicit',
						body: 'Get “Inflict Cold Exposure on Hit” from Eater of Worlds currency as soon as practical. Freeze proliferation is the next quality-of-life implicit because it improves Herald of Ice clearing.',
						sourceLabel: 'Fubgun — gear modifiers, 11:11',
						sourceUrl: atTime(FUBGUN_GUIDE_URL, 671)
					},
					{
						title: 'Frostbite and exposure work together',
						body: 'Mastermind of Discord strengthens your exposure, then Frostbite pushes cold resistance down further. This is the intended curse package; do not replace it only because another mark looks better in a tooltip.',
						sourceLabel: 'Fubgun — Frostbite, 7:58',
						sourceUrl: atTime(FUBGUN_GUIDE_URL, 478)
					},
					{
						title: 'Judge the build as a mapper',
						body: 'This version is designed to earn currency and reach four watchstones. Pinnacle bosses may take time and Ubers are not the target; upgrade the farming loop before chasing boss-only damage.',
						sourceLabel: 'Zizaran — build expectations, 4:11',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 251)
					}
				],
				todos: [
					todo(
						'mid-tree',
						'Complete the Midgame crit-tree respec and compare every mastery',
						'during'
					),
					todo(
						'mid-refractor',
						'Price Mystic Refractor; buy it only after core defenses and cast speed are stable',
						'during'
					),
					todo(
						'mid-gloves',
						'Add Cold Exposure on Hit to gloves, then target freeze proliferation',
						'during'
					),
					todo(
						'mid-gear',
						'Use a Moonstone cast-speed ring and repair life, ES, resist, and Dexterity gaps',
						'during'
					),
					todo('mid-atlas', 'Choose a first Atlas strategy and save the tree link', 'during'),
					todo(
						'mid-support-test',
						'Compare projectile-support setups in maps and on one pinnacle boss',
						'before-next'
					),
					todo(
						'mid-complete',
						'Finish four watchstones or write down the exact encounter blocking you',
						'before-next'
					),
					todo(
						'mid-purchase',
						'Fund one endgame rare instead of making several small sideways upgrades',
						'before-next'
					)
				]
			},
			{
				id: 'endgame-no-cluster',
				title: 'Endgame – No Cluster',
				eyebrow: 'Baseline endgame',
				description:
					'Build a dependable endgame baseline before paying for cluster jewels. This is the spot to prove the farming loop and eliminate unclear upgrade goals.',
				uniques: uniques('mom-crit-winter-orb', 'endgame-no-cluster'),
				equipment: equipment('mom-crit-winter-orb', 'endgame-no-cluster'),
				gems: gems('mom-crit-winter-orb', 'endgame-no-cluster'),
				noteHighlights: [
					'Re-test the projectile support after Dying Sun is equipped; actual overlap and clearing matter more than the tooltip.',
					'Do not overspend trying to force boss damage into the mapper. Save toward clusters, power charges, or a Creeping Frost package.',
					'Keep cast speed on the endgame wand and ring so the upgraded character still feels responsive.'
				],
				insights: [
					{
						title: 'Dying Sun changes the support-gem decision',
						body: 'Dying Sun supplies projectiles and Area of Effect, so this is the point to retest GMP or Multiple Projectiles against a pure damage support. Keep the projectile support if real clearing and overlap are still better.',
						sourceLabel: 'Zizaran — notes and FAQ, 4:11',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 251)
					},
					{
						title: 'The endgame rare package is specific',
						body: 'The PoB targets a +2 Profane Wand with cast speed, a +1 cold shield with life and block, Cold Exposure plus Unnerve gloves, and high Armour/ES bases. Treat those as separate projects, not one giant shopping list.',
						sourceLabel: 'Open the Endgame PoB gear',
						sourceUrl: PRIMARY_POB_URL
					},
					{
						title: 'Layer defenses instead of reading only Life',
						body: 'Mind Over Matter, Eldritch Battery, Energy Shield, armour, and block all contribute. The build is sturdier than its Life number suggests, but it is not meant to face-tank major pinnacle slams.',
						sourceLabel: 'Zizaran — solving mana, 7:42',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 462)
					},
					{
						title: 'Cast speed still outranks decorative damage',
						body: 'The endgame PoB keeps a Profane Wand, cast speed on the wand and ring, and a cast-speed helmet implicit. If the character feels clumsy, fix ramp speed before buying more critical multiplier.',
						sourceLabel: 'Zizaran — gear priorities, 2:27',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 147)
					},
					{
						title: 'Know the ceiling before spending',
						body: 'This setup should comfortably map and obtain watchstones, but it is not an Uber farmer. If single target is the frustration, save toward the cluster or power-charge transition instead of endlessly polishing this version.',
						sourceLabel: 'Fubgun — optional endgame, 16:14',
						sourceUrl: atTime(FUBGUN_GUIDE_URL, 974)
					}
				],
				todos: [
					todo(
						'end-no-tree',
						'Match the no-cluster passive tree, masteries, and gem setup',
						'during'
					),
					todo(
						'end-no-dying-sun',
						'Equip Dying Sun and retest whether a projectile support still earns its socket',
						'during'
					),
					todo(
						'end-no-wand',
						'Plan or acquire the +2 Profane Wand with cast speed shown in the PoB',
						'during'
					),
					todo(
						'end-no-defences',
						'Build the +1 cold life/block shield and high Armour/ES defensive bases',
						'during'
					),
					todo('end-no-gloves', 'Finish Cold Exposure and Unnerve on the endgame gloves', 'during'),
					todo(
						'end-no-pob',
						'Import your character and compare effective hit pool and DPS',
						'during'
					),
					todo('end-no-farm', 'Run the farming strategy for a complete tracked set', 'during'),
					todo(
						'end-no-list',
						'Price the Stormrider large cluster and Enduring Composure small cluster',
						'before-next'
					),
					todo('end-no-budget', 'Reach the cluster transition budget', 'before-next')
				]
			},
			{
				id: 'endgame-cluster',
				title: 'Endgame – Cluster',
				eyebrow: 'Primary destination',
				description:
					'Complete the first build’s intended destination, then decide whether the power-charge transition is exciting enough to become the next project.',
				uniques: uniques('mom-crit-winter-orb', 'endgame-cluster'),
				equipment: equipment('mom-crit-winter-orb', 'endgame-cluster'),
				gems: gems('mom-crit-winter-orb', 'endgame-cluster'),
				noteHighlights: [
					'Swap to Shaper of Storms when Stormrider is installed so the cluster notable has reliable shock support.',
					'Use low-level Forbidden Rite with Enduring Composure to begin generating endurance charges before boss contact.',
					'Finish Winter Orb socket quality first. Focused Channeling remains optional behavior to test, not a dependency.'
				],
				insights: [
					{
						title: 'Shaper of Storms enables Stormrider',
						body: 'The cluster destination is where the ascendancy swap matters: reliable shocks from Shaper of Storms enable Stormrider. Confirm both pieces together instead of copying only the passive points.',
						sourceLabel: 'Read the PoB ascendancy notes',
						sourceUrl: PRIMARY_POB_URL
					},
					{
						title: 'Forbidden Rite is an endurance-charge trigger',
						body: 'With Enduring Composure equipped, a level 1 Forbidden Rite self-hit starts endurance-charge generation before a boss hits you. Its job is utility, so do not level it for damage.',
						sourceLabel: 'Zizaran — Forbidden Rite tech, 6:09',
						sourceUrl: atTime(ZIZARAN_GUIDE_URL, 369)
					},
					{
						title: 'Focused Channeling is optional tech',
						body: 'The support may preserve its damage ramp while any Winter Orb stages remain, but the behavior could change. The selected PoB intentionally does not depend on it; test it rather than planning the build around a snapshot.',
						sourceLabel: 'Fubgun — snapshot explanation, 6:34',
						sourceUrl: atTime(FUBGUN_GUIDE_URL, 394)
					},
					{
						title: 'Spend socket quality in priority order',
						body: 'Winter Orb comes first, followed by Increased Critical Damage, golems, movement skills, Immortal Call, Frostblink, and Herald of Ice. Winter Orb quality directly supports stages and uptime.',
						sourceLabel: 'Read the PoB socket-quality notes',
						sourceUrl: PRIMARY_POB_URL
					},
					{
						title: 'Elementalist is the affordable destination',
						body: 'Occultist and power-charge stacking can scale much higher, but the expensive version has different gear and mana demands. Finish and test this mapper before treating that transition as mandatory.',
						sourceLabel: 'Fubgun — power-charge setup, 17:44',
						sourceUrl: atTime(FUBGUN_GUIDE_URL, 1064)
					}
				],
				todos: [
					todo(
						'end-cluster-swap',
						'Install the Stormrider cluster setup and finish the required respec',
						'during'
					),
					todo(
						'end-cluster-ascendancy',
						'Confirm Shaper of Storms is active and actually enabling Stormrider',
						'during'
					),
					todo(
						'end-cluster-composure',
						'Add Enduring Composure and verify level 1 Forbidden Rite starts charge generation',
						'during'
					),
					todo(
						'end-cluster-gems',
						'Finish the socket-quality priorities and retest the final support setup',
						'during'
					),
					todo(
						'end-cluster-test',
						'Run a complete farming set and one pinnacle boss with the finished setup',
						'during'
					),
					todo(
						'end-cluster-review',
						'Record clear speed, boss time, deaths, and currency per hour',
						'before-next'
					),
					todo(
						'end-cluster-next',
						'Choose: keep farming, add Creeping Frost, or price the power-charge transition',
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
		notes: transitionBuildNotes,
		steps: [
			{
				id: 'entering-maps',
				title: 'Entering maps',
				eyebrow: 'Entry point',
				description:
					'Capture the mapping baseline represented by this build before changing its core pieces.',
				uniques: uniques('hybrid-crit-winter-orb', 'entering-maps'),
				equipment: equipment('hybrid-crit-winter-orb', 'entering-maps'),
				gems: gems('hybrid-crit-winter-orb', 'entering-maps'),
				noteHighlights: [
					'Use Brine King, Steelskin, and a bleed-removal life flask while the character is still life-based.',
					'Start with Alira if resistance is tight, and generate early frenzy charges with Herald of Ice plus Ice Bite.'
				],
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
				uniques: uniques('hybrid-crit-winter-orb', 'early-game'),
				equipment: equipment('hybrid-crit-winter-orb', 'early-game'),
				gems: gems('hybrid-crit-winter-orb', 'early-game'),
				noteHighlights: [
					'Stay Elementalist while golems are carrying damage, defense, and mana regeneration.',
					'Use the affordable weapon tier that keeps mapping comfortable; a rare wand does not win until it reaches double +1 gem levels.'
				],
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
				uniques: uniques('hybrid-crit-winter-orb', 'transition-mid-game'),
				equipment: equipment('hybrid-crit-winter-orb', 'transition-mid-game'),
				gems: gems('hybrid-crit-winter-orb', 'transition-mid-game'),
				noteHighlights: [
					'Progress the amulet from a rare +1 cold option toward Pandemonius or a +3 Winter Orb Replica Dragonfang when prices allow.',
					'Secure corrupted-blood immunity on a jewel before replacing the bleed-removal life flask.'
				],
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
				uniques: uniques('hybrid-crit-winter-orb', 'endgame-optional'),
				equipment: equipment('hybrid-crit-winter-orb', 'endgame-optional'),
				gems: gems('hybrid-crit-winter-orb', 'endgame-optional'),
				noteHighlights: [
					'Prioritize rare jewels with two useful critical-multiplier modifiers before adding Energy Shield.',
					'Verify Focused Channeling behavior in the current league before valuing it as permanent snapshot damage.'
				],
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
				uniques: uniques('hybrid-crit-winter-orb', 'pcharge-stack'),
				equipment: equipment('hybrid-crit-winter-orb', 'pcharge-stack'),
				gems: gems('hybrid-crit-winter-orb', 'pcharge-stack'),
				noteHighlights: [
					'Do not switch to Occultist until the full Energy Shield and power-charge package is ready.',
					'Badge of the Brotherhood, Power Charge on Critical, and a reliable frenzy-charge source need to come online together.'
				],
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
				uniques: uniques('hybrid-crit-winter-orb', 'uber-pcharge'),
				equipment: equipment('hybrid-crit-winter-orb', 'uber-pcharge'),
				gems: gems('hybrid-crit-winter-orb', 'uber-pcharge'),
				noteHighlights: [
					'Switch from Brine King to Lunaris or Solaris after Occultist supplies its own stun, freeze, and chill protection.',
					'Use Immortal Call with the larger Energy Shield pool and finish the Elegant Hubris and ailment-immunity projects.'
				],
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
