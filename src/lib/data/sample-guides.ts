import equipmentItems from '$lib/data/equipment.json';
import gemGroups from '$lib/data/gems.json';
import uniqueItems from '$lib/data/unique-items.json';
import { transitionBuildNotes } from '$lib/data/build-notes';
import type {
	BuildGuide,
	GuideEquipmentItem,
	GuideGemGroup,
	GuideInsight,
	GuideStep,
	GuideUnique,
	TodoPhase
} from '$lib/types/guide';

const checklistItem = (id: string, text: string, phase: TodoPhase): GuideStep['todos'][number] => ({
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

export const TRANSITION_POB_URL = 'https://pobb.in/cd6A9tg8QjrJ';
export const FUBGUN_GUIDE_URL = 'https://www.youtube.com/watch?v=--XDhqSlwPA';
export const ZIZARAN_GUIDE_URL = 'https://www.youtube.com/watch?v=OZypCJ-5Bog';
export const MAXROLL_URL =
	'https://maxroll.gg/poe/build-guides/winter-orb-elementalist-league-starter';

const pobInsight = (title: string, body: string, loadout: string): GuideInsight => ({
	title,
	body,
	sourceLabel: `Source PoB — ${loadout}`,
	sourceUrl: TRANSITION_POB_URL
});

const guideId = 'hybrid-crit-winter-orb';

export const sampleGuides: BuildGuide[] = [
	{
		id: guideId,
		name: 'Winter Orb Transition',
		buildVersion: '3.28',
		className: 'Elementalist → Occultist',
		level: 95,
		sourceUrl: TRANSITION_POB_URL,
		notes: transitionBuildNotes,
		steps: [
			{
				id: 'entering-maps',
				title: 'Entering maps',
				eyebrow: 'Life-based baseline',
				description:
					'Assemble the life-based Elementalist exactly enough to enter maps with working defenses, recovery, charges, and movement.',
				level: 70,
				allocatedPassivePoints: 93,
				uniques: uniques(guideId, 'entering-maps'),
				equipment: equipment(guideId, 'entering-maps'),
				gems: gems(guideId, 'entering-maps'),
				noteHighlights: [
					'Stay Elementalist and use Brine King while the character still relies on Life, golems, and a bleed-removal flask.',
					'This checkpoint intentionally keeps an Enduring Mana Flask. Do not remove it until the Early game setup sustains Winter Orb without it.',
					'Focused Channelling and Inspiration are PoB options here; test them instead of assuming every displayed gem should be enabled.'
				],
				insights: [
					pobInsight(
						'Build the safety net before damage',
						'The entering-maps set is mostly rare Life and Energy Shield gear with resistances, four golems, Steelskin, and recovery flasks. Fix those systems before buying damage.',
						'Entering maps'
					),
					pobInsight(
						'Use the first map as a systems check',
						'One clean white map should prove that Winter Orb sustains, movement links work, golems remain active, the guard setup triggers, and flask answers are on the correct keys.',
						'Entering maps'
					)
				],
				todos: [
					checklistItem(
						'maps-tree',
						'Open the Entering maps passive tree and apply every required allocation and respec',
						'during'
					),
					checklistItem(
						'maps-elementalist',
						'Confirm Elementalist is selected and set Soul of the Brine King as the major Pantheon',
						'during'
					),
					checklistItem(
						'maps-defences',
						'Cap all elemental resistances and fill missing Life, Energy Shield, Strength, and Dexterity',
						'during'
					),
					checklistItem(
						'maps-main-link',
						'Socket Winter Orb with Cold Penetration, Infused Channelling, Multiple Projectiles, and Focused Channelling; keep Inspiration as the optional swap shown in PoB',
						'during'
					),
					checklistItem(
						'maps-golems',
						'Socket and summon the Ice, Lightning, Flame, and Stone Golems',
						'during'
					),
					checklistItem(
						'maps-utility',
						'Set up Steelskin, Automation, Arcane Surge, and Frostbite in the boots',
						'during'
					),
					checklistItem(
						'maps-clear-links',
						'Set up Frostblink plus Herald of Ice and Ice Bite for clear and early frenzy-charge generation',
						'during'
					),
					checklistItem(
						'maps-movement',
						'Set up Shield Charge, Faster Attacks, and Momentum and confirm both movement skills are bound',
						'during'
					),
					checklistItem(
						'maps-flasks',
						'Equip an instant Life Flask with bleed and Corrupted Blood removal, plus Quicksilver, Silver, and Enduring Mana flasks',
						'during'
					),
					checklistItem(
						'maps-test',
						'Run one white map and verify casting sustain, guard automation, curse application, movement, and flask keys',
						'during'
					),
					checklistItem(
						'maps-match',
						'Compare the passive tree, equipment, gems, and flask bar against the Entering maps loadout one final time',
						'before-next'
					),
					checklistItem(
						'maps-resists-ready',
						'Confirm elemental resistances remain capped without temporary campaign buffs',
						'before-next'
					),
					checklistItem(
						'maps-recovery-ready',
						'Trigger the Life Flask while bleeding and verify the recovery and removal behavior',
						'before-next'
					),
					checklistItem(
						'maps-sustain-ready',
						'Complete a map without running out of mana or losing all four golems',
						'before-next'
					)
				]
			},
			{
				id: 'early-game',
				title: 'Early game',
				eyebrow: 'Critical foundation',
				description:
					'Upgrade the rare defensive shell, move Winter Orb into its early critical setup, and remove the Mana Flask only after sustain is solved.',
				level: 92,
				allocatedPassivePoints: 115,
				uniques: uniques(guideId, 'early-game'),
				equipment: equipment(guideId, 'early-game'),
				gems: gems(guideId, 'early-game'),
				noteHighlights: [
					'Stay Elementalist; the golems are still supplying damage, defense, and mana regeneration.',
					'The main link changes to Increased Critical Damage, Increased Critical Strikes, Power Charge on Critical, Multiple Projectiles, and Focused Channelling.',
					'The flask bar adds Diamond and Jade flasks. Removing the Enduring Mana Flask is a sustain check, not a mandatory early shortcut.'
				],
				insights: [
					pobInsight(
						'This is the first critical-strike checkpoint',
						'Power Charge on Critical and the two critical supports replace the entering-maps damage package. Verify charges in real combat rather than reading only the hideout tooltip.',
						'Early game'
					),
					pobInsight(
						'Removing the Mana Flask is a pass/fail test',
						'The Early game flask set assumes Winter Orb can run without an Enduring Mana Flask. Keep the old flask until regeneration, cost, and cast speed make that true.',
						'Early game'
					)
				],
				todos: [
					checklistItem(
						'early-tree',
						'Apply the Early game passive tree changes while remaining Elementalist',
						'during'
					),
					checklistItem(
						'early-bases',
						'Replace the entry armour pieces with the higher Energy Shield bases shown in the Early game equipment set',
						'during'
					),
					checklistItem(
						'early-defences',
						'Re-cap elemental resistances and repair Life, Energy Shield, and attribute gaps after changing bases',
						'during'
					),
					checklistItem(
						'early-main-link',
						'Change the Winter Orb links to Increased Critical Damage, Increased Critical Strikes, Multiple Projectiles, Power Charge on Critical, and Focused Channelling',
						'during'
					),
					checklistItem(
						'early-flasks',
						'Add Diamond and Jade flasks and keep the instant bleed-removal Life Flask',
						'during'
					),
					checklistItem(
						'early-mana-test',
						'Remove the Mana Flask only after a full map confirms Winter Orb sustains without it',
						'during'
					),
					checklistItem(
						'early-charge-test',
						'Verify Power Charge on Critical generates power charges and Herald of Ice plus Ice Bite generates frenzy charges while clearing',
						'during'
					),
					checklistItem(
						'early-links-check',
						'Confirm the golem, guard, curse, Herald, and movement groups still match the PoB after recolouring gear',
						'during'
					),
					checklistItem(
						'early-match',
						'Match the complete Early game tree, equipment, flask, and gem loadouts',
						'before-next'
					),
					checklistItem(
						'early-no-mana-flask',
						'Complete one map without a Mana Flask and without interrupting Winter Orb for lack of mana',
						'before-next'
					),
					checklistItem(
						'early-charge-ready',
						'Confirm power charges are reliable on bosses and frenzy charges are reliable during clear',
						'before-next'
					),
					checklistItem(
						'early-price-mid',
						'Price Mystic Refractor, Pandemonius, Death Rush, and Rumi’s Concoction before buying the Mid game package',
						'before-next'
					)
				]
			},
			{
				id: 'transition-mid-game',
				title: 'Mid game',
				eyebrow: 'Bridge uniques',
				description:
					'Install the projectile, amulet, mapping, and block upgrades while preparing the Chaos Inoculation swap entirely off-character.',
				level: 95,
				allocatedPassivePoints: 118,
				uniques: uniques(guideId, 'transition-mid-game'),
				equipment: equipment(guideId, 'transition-mid-game'),
				gems: gems(guideId, 'transition-mid-game'),
				noteHighlights: [
					'Mystic Refractor, Pandemonius, Death Rush, and Rumi’s Concoction are bridge items, not the final charge-stacking shell.',
					'The Winter Orb link replaces Multiple Projectiles with Infused Channelling at this checkpoint.',
					'Stay Elementalist and life-based while collecting the complete Energy Shield, passive-tree, aura, and jewel package for the next step.'
				],
				insights: [
					pobInsight(
						'Buy the bridge as a package',
						'Mystic Refractor adds projectile coverage, Pandemonius improves cold damage, Death Rush rewards mapping, and Rumi’s supports block. Check that the combined swap preserves defenses.',
						'Mid game'
					),
					pobInsight(
						'Prepare Chaos Inoculation without weakening the live character',
						'Keep mapping on the working Elementalist while the Occultist tree, Energy Shield rares, aura sockets, and replacement flasks are assembled in the stash.',
						'Mid game'
					)
				],
				todos: [
					checklistItem(
						'mid-tree',
						'Apply the Mid game passive tree changes while remaining Elementalist',
						'during'
					),
					checklistItem(
						'mid-weapon',
						'Equip Mystic Refractor and confirm the additional projectiles improve real clear and overlap',
						'during'
					),
					checklistItem(
						'mid-amulet',
						'Equip Pandemonius and re-check attributes and resistances',
						'during'
					),
					checklistItem(
						'mid-ring',
						'Equip Death Rush and verify Adrenaline uptime during mapping',
						'during'
					),
					checklistItem(
						'mid-rumi',
						'Equip Rumi’s Concoction and verify block values while the flask is active',
						'during'
					),
					checklistItem(
						'mid-main-link',
						'Replace Multiple Projectiles with Infused Channelling in the Winter Orb link',
						'during'
					),
					checklistItem(
						'mid-exposure',
						'Confirm Cold Exposure is applied by the intended glove implicit or another reliable source',
						'during'
					),
					checklistItem(
						'mid-corrupted-blood',
						'Acquire Corrupted Blood immunity on an affordable jewel before planning to remove the Life Flask',
						'during'
					),
					checklistItem(
						'mid-farm-batch',
						'Configure one repeatable Atlas map-and-scarab setup and run one complete batch without changing strategies',
						'during'
					),
					checklistItem(
						'mid-ci-stash',
						'Collect the Endgame Optional Energy Shield gear, aura sockets, jewels, and respec currency in the stash',
						'during'
					),
					checklistItem(
						'mid-match',
						'Match the complete Mid game tree, equipment, flask, and gem loadouts',
						'before-next'
					),
					checklistItem(
						'mid-bridge-ready',
						'Complete a map with Mystic Refractor, Pandemonius, Death Rush, and Rumi’s all functioning',
						'before-next'
					),
					checklistItem(
						'mid-cb-ready',
						'Verify Corrupted Blood immunity without relying on the Life Flask suffix',
						'before-next'
					),
					checklistItem(
						'mid-ci-ready',
						'Place every required Occultist, Chaos Inoculation, aura, and Energy Shield swap item together in the stash',
						'before-next'
					),
					checklistItem(
						'mid-respec-ready',
						'Count the required passive and ascendancy respecs and acquire enough refund points or Orbs of Regret',
						'before-next'
					)
				]
			},
			{
				id: 'endgame-optional',
				title: 'Endgame Optional',
				eyebrow: 'Occultist and CI',
				description:
					'Perform the first major transition: move to Occultist and Chaos Inoculation, replace Life recovery with Energy Shield systems, and install the premium non-charge gear.',
				level: 97,
				allocatedPassivePoints: 120,
				uniques: uniques(guideId, 'endgame-optional'),
				equipment: equipment(guideId, 'endgame-optional'),
				gems: gems(guideId, 'endgame-optional'),
				noteHighlights: [
					'This is the first Occultist and Chaos Inoculation checkpoint; do the ascendancy, passive tree, gear, aura, and flask changes together.',
					'Replica Dragonfang’s Flight, Light of Lunaris, Dying Sun, Watcher’s Eye, and The Light of Meaning form the premium pre-charge setup.',
					'Focused Channelling is still experimental snapshot tech. Test its current behavior before valuing it as guaranteed damage.'
				],
				insights: [
					pobInsight(
						'This is the real defensive transition',
						'The loadout drops the Life Flask, adds Discipline, changes to Occultist, and uses Chaos Inoculation. Partial swaps can leave the character with neither Life recovery nor a complete Energy Shield defense.',
						'Endgame Optional'
					),
					pobInsight(
						'Optional is a complete stopping point',
						'This loadout already has the rare wand, premium amulet, shield, jewels, and projectile flask needed for a strong mapper. Charge stacking is a later rebuild, not a required repair.',
						'Endgame Optional'
					)
				],
				todos: [
					checklistItem(
						'optional-stash-check',
						'Lay out every Occultist, Chaos Inoculation, gear, flask, gem, and jewel replacement before starting the swap',
						'during'
					),
					checklistItem(
						'optional-ascendancy',
						'Respec from Elementalist to the Endgame Optional Occultist ascendancy and passive tree',
						'during'
					),
					checklistItem(
						'optional-ci',
						'Allocate Chaos Inoculation and equip the complete Energy Shield rare shell in the same session',
						'during'
					),
					checklistItem(
						'optional-core-gear',
						'Equip the Profane Wand, Light of Lunaris, Replica Dragonfang’s Flight, Moonstone Ring, and Stygian Vise shown in PoB',
						'during'
					),
					checklistItem(
						'optional-flasks',
						'Replace the Life Flask with Rumi’s Concoction and equip Dying Sun in the final flask slot',
						'during'
					),
					checklistItem(
						'optional-jewels',
						'Equip the Watcher’s Eye and The Light of Meaning shown in the Endgame Optional passive tree',
						'during'
					),
					checklistItem(
						'optional-main-link',
						'Change Winter Orb to Infused Channelling, Cold Penetration, Inspiration, Power Charge on Critical, and Focused Channelling',
						'during'
					),
					checklistItem(
						'optional-auras',
						'Socket Zealotry, Discipline, Enlighten, and Tempest Shield and verify every intended reservation fits',
						'during'
					),
					checklistItem(
						'optional-utility',
						'Move Frostblink to the shield group and keep Steelskin, Automation, Arcane Surge, and Frostbite in the boots',
						'during'
					),
					checklistItem(
						'optional-pantheon',
						'Switch the major Pantheon from Brine King to Lunaris or Solaris and select the minor Pantheon for current content',
						'during'
					),
					checklistItem(
						'optional-defences',
						'Re-cap elemental resistances, meet attributes, compare total Energy Shield to PoB, and explicitly solve shock',
						'during'
					),
					checklistItem(
						'optional-focused-test',
						'Test Focused Channelling in the current league and keep it only if its behavior is confirmed',
						'during'
					),
					checklistItem(
						'optional-match',
						'Match the complete Endgame Optional ascendancy, tree, equipment, flask, jewel, and gem loadouts',
						'before-next'
					),
					checklistItem(
						'optional-ci-ready',
						'Complete a map with no Life Flask and verify Energy Shield recovery, chaos immunity, and guard behavior',
						'before-next'
					),
					checklistItem(
						'optional-ailment-ready',
						'Verify stun, freeze, chill, ignite, shock, bleed, and Corrupted Blood answers after leaving Brine King',
						'before-next'
					),
					checklistItem(
						'optional-jewel-ready',
						'Replace weak rare jewels with two applicable critical-multiplier modifiers before adding Energy Shield',
						'before-next'
					),
					checklistItem(
						'optional-charge-stash',
						'Acquire and place the complete Pcharge Stack equipment package in the stash before equipping any part of it',
						'before-next'
					)
				]
			},
			{
				id: 'pcharge-stack',
				title: 'Pcharge Stack',
				eyebrow: 'Charge package',
				description:
					'Install the power- and frenzy-charge package as one coordinated rebuild, then verify every charge, ailment, gem, and defensive interaction.',
				level: 97,
				allocatedPassivePoints: 120,
				uniques: uniques(guideId, 'pcharge-stack'),
				equipment: equipment(guideId, 'pcharge-stack'),
				gems: gems(guideId, 'pcharge-stack'),
				noteHighlights: [
					'Equip Tulfall, Malachai’s Loop, Willclash, Ralakesh’s Impatience, Badge of the Brotherhood, two Romira’s Banquets, and Graven’s Secret together.',
					'Badge, Power Charge on Critical, Herald of Ice plus Ice Bite, and the selected Elegant Hubris must provide a coherent charge cycle.',
					'Malachai’s Loop can shock the character. Verify the shock solution before treating the transition as complete.'
				],
				insights: [
					pobInsight(
						'Do not wear half of this setup',
						'Most rare slots become charge uniques at once. A partial swap commonly loses resistances, attributes, Energy Shield, and the interactions that make those uniques worthwhile.',
						'Pcharge Stack'
					),
					pobInsight(
						'Verify the charge loop in combat',
						'Maximum-charge counts, generation, loss, frenzy conversion, and boss reliability matter more than the hideout tooltip. Test the full cycle against a map boss.',
						'Pcharge Stack'
					)
				],
				todos: [
					checklistItem(
						'pc-package',
						'Acquire Tulfall, Malachai’s Loop, Willclash, Ralakesh’s Impatience, Badge of the Brotherhood, two Romira’s Banquets, and Graven’s Secret',
						'during'
					),
					checklistItem(
						'pc-rare-support',
						'Prepare the Body Armour and Gloves that preserve Energy Shield, resistances, attributes, and required sockets around the unique package',
						'during'
					),
					checklistItem(
						'pc-tree',
						'Apply the Pcharge Stack Occultist passive tree and mastery changes',
						'during'
					),
					checklistItem(
						'pc-equip-all',
						'Equip the complete charge package in one session and immediately repair resistance and attribute failures',
						'during'
					),
					checklistItem(
						'pc-hubris',
						'Socket an Elegant Hubris with useful damage per power charge, critical multiplier, spell damage, or Energy Shield notables',
						'during'
					),
					checklistItem(
						'pc-main-link',
						'Match the Pcharge Stack Winter Orb links and retain Multiple Projectiles only as the disabled swap shown in PoB',
						'during'
					),
					checklistItem(
						'pc-boots',
						'Set up Sniper’s Mark, Cast when Damage Taken, and Immortal Call in the boots',
						'during'
					),
					checklistItem(
						'pc-gloves',
						'Set up Herald of Ice, Scornful Herald, Ice Bite, and Power Charge on Critical in the gloves',
						'during'
					),
					checklistItem(
						'pc-weapons',
						'Set up Frostblink, Frost Shield, and Arcane Surge in the weapon and Shield Charge, Faster Attacks, and Momentum in the shield',
						'during'
					),
					checklistItem(
						'pc-charge-test',
						'Record maximum power and frenzy charges, then verify generation and cycling while clearing and on a map boss',
						'during'
					),
					checklistItem(
						'pc-shock',
						'Trigger the Malachai’s Loop interaction and verify the intended shock mitigation or immunity works',
						'during'
					),
					checklistItem(
						'pc-defences',
						'Compare Energy Shield, resistances, block, attributes, and ailment defenses against the Pcharge Stack PoB',
						'during'
					),
					checklistItem(
						'pc-projectiles',
						'Test Dying Sun with and without the disabled Multiple Projectiles swap and keep the better real mapping setup',
						'during'
					),
					checklistItem(
						'pc-match',
						'Match the complete Pcharge Stack tree, equipment, jewels, flasks, and gem groups',
						'before-next'
					),
					checklistItem(
						'pc-charge-ready',
						'Complete a map boss with stable power and frenzy charges and no unexplained charge collapse',
						'before-next'
					),
					checklistItem(
						'pc-guard-ready',
						'Take controlled damage and verify Cast when Damage Taken triggers Immortal Call at the intended levels',
						'before-next'
					),
					checklistItem(
						'pc-defence-ready',
						'Confirm resistances, attributes, shock defense, and Energy Shield remain functional with every charge unique equipped',
						'before-next'
					),
					checklistItem(
						'pc-uber-list',
						'List the exact Uber Pcharge corruptions, unique jewels, and roll upgrades still missing',
						'before-next'
					)
				]
			},
			{
				id: 'uber-pcharge',
				title: 'Uber Pcharge',
				eyebrow: 'Final refinement',
				description:
					'Keep the working charge shell and finish its corruptions, jewel package, rolls, passive tree, and streamlined reservation setup.',
				level: 98,
				allocatedPassivePoints: 121,
				uniques: uniques(guideId, 'uber-pcharge'),
				equipment: equipment(guideId, 'uber-pcharge'),
				gems: gems(guideId, 'uber-pcharge'),
				noteHighlights: [
					'The core equipment does not change; the meaningful upgrades are rolls, corruptions, unique jewels, and the final passive tree.',
					'Both Romira’s Banquets gain +1 maximum power charge corruptions in the Uber loadout.',
					'The final gem setup removes Flesh and Stone plus Enlighten and replaces the boot Arcane Surge with More Duration.'
				],
				insights: [
					pobInsight(
						'This step refines instead of rebuilding',
						'The Pcharge and Uber Pcharge equipment names are the same. Use the equipment comparison to target the Tulfall, Malachai’s Loop, and double-Romira roll or corruption changes.',
						'Uber Pcharge'
					),
					pobInsight(
						'The jewel package is the largest structural change',
						'Unnatural Instinct, Impossible Escape, Elegant Hubris, The Light of Meaning, and Sublime Vision accompany the final passive tree. Treat their sockets and affected nodes as one checklist.',
						'Uber Pcharge'
					)
				],
				todos: [
					checklistItem(
						'uber-tree',
						'Apply the Uber Pcharge passive tree and mastery changes before evaluating the final numbers',
						'during'
					),
					checklistItem(
						'uber-romiras',
						'Acquire +1 maximum power charge corruptions on both Romira’s Banquets',
						'during'
					),
					checklistItem(
						'uber-tulfall',
						'Upgrade Tulfall to the higher cold damage per power charge roll shown in the Uber equipment set',
						'during'
					),
					checklistItem(
						'uber-malachai',
						'Upgrade Malachai’s Loop to the target spell damage per power charge roll',
						'during'
					),
					checklistItem(
						'uber-jewels',
						'Acquire and socket Unnatural Instinct, Impossible Escape, Elegant Hubris, The Light of Meaning, and Sublime Vision in their PoB locations',
						'during'
					),
					checklistItem(
						'uber-hubris',
						'Verify the final Elegant Hubris seed grants the intended charge, critical, spell, or Energy Shield notables',
						'during'
					),
					checklistItem(
						'uber-gems',
						'Remove Flesh and Stone plus Enlighten and replace the boot Arcane Surge with More Duration',
						'during'
					),
					checklistItem(
						'uber-defences',
						'Re-check Energy Shield, resistances, attributes, reservation, shock defense, and every other ailment answer after the final tree and jewels',
						'during'
					),
					checklistItem(
						'uber-match',
						'Match the complete Uber Pcharge tree, equipment rolls, corruptions, jewels, flasks, and gem groups',
						'before-next'
					),
					checklistItem(
						'uber-charge-ready',
						'Verify the final maximum power and frenzy charge counts in hideout and against a map boss',
						'before-next'
					),
					checklistItem(
						'uber-numbers-ready',
						'Compare Energy Shield, damage, block, reservation, and ailment defenses against the Uber Pcharge PoB and explain every material gap',
						'before-next'
					),
					checklistItem(
						'uber-validation',
						'Complete one repeatable mapping test and one boss test without changing gear, gems, or flasks between attempts',
						'before-next'
					)
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
