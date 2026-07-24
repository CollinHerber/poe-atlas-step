<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, tick, untrack } from 'svelte';
	import { Badge, Button, Progressbar } from 'flowbite-svelte';
	import {
		ArrowLeftOutline,
		ArrowDownOutline,
		ArrowRightOutline,
		ArrowUpOutline,
		ArrowUpRightFromSquareOutline,
		AtomOutline,
		BookmarkOutline,
		BookOpenOutline,
		CheckOutline,
		CloseOutline,
		EditOutline,
		GithubSolid,
		LinkOutline,
		ListOutline,
		PlusOutline,
		RefreshOutline,
		StarOutline
	} from 'flowbite-svelte-icons';
	import BuildLibrary from '$lib/components/BuildLibrary.svelte';
	import BuildNotesSection from '$lib/components/BuildNotesSection.svelte';
	import BuildCompare from '$lib/components/BuildCompare.svelte';
	import BuildUniquesDashboard from '$lib/components/BuildUniquesDashboard.svelte';
	import ChecklistSection from '$lib/components/ChecklistSection.svelte';
	import EquipmentSection from '$lib/components/EquipmentSection.svelte';
	import GemGroupsSection from '$lib/components/GemGroupsSection.svelte';
	import ProgressRail from '$lib/components/ProgressRail.svelte';
	import StepInsights from '$lib/components/StepInsights.svelte';
	import StepSwapOverview from '$lib/components/StepSwapOverview.svelte';
	import StepTableOfContents from '$lib/components/StepTableOfContents.svelte';
	import UniqueItemsSection from '$lib/components/UniqueItemsSection.svelte';
	import {
		FUBGUN_GUIDE_URL,
		MAXROLL_URL,
		TRANSITION_POB_URL,
		ZIZARAN_GUIDE_URL,
		cloneGuide,
		findGuideByUrl,
		sampleGuides
	} from '$lib/data/sample-guides';
	import {
		clonePlainGuide,
		createSavedBuildId,
		readSavedBuilds,
		writeSavedBuilds
	} from '$lib/persistence/build-library';
	import { buildPathOfBuildingUrl } from '$lib/poe/path-of-building';
	import { importPobbBuild } from '$lib/poe/pobb-import';
	import {
		createShareUrl,
		decodeSharedBuild,
		encodeSharedBuild,
		readSharedBuildToken
	} from '$lib/sharing/build-share';
	import { shortenShareUrl } from '$lib/sharing/url-shortener';
	import type { SavedBuildRecord } from '$lib/persistence/build-library';
	import type {
		BuildGuide,
		GuideInsight,
		GuideOptionalUnique,
		GuideStep,
		PoeNinjaPriceSnapshot,
		TodoPhase,
		UniqueTierSnapshot
	} from '$lib/types/guide';

	const SITE_URL = 'https://collinherber.github.io/poe-build-tool/';
	const SOCIAL_IMAGE_URL = `${SITE_URL}og.png`;
	const SITE_TITLE = 'Atlas Step — Path of Exile Build Progression Planner';
	const SITE_DESCRIPTION =
		'Turn Path of Building loadouts into an editable, step-by-step league progression checklist for gear, gems, upgrades, and build transitions.';
	const STEP_CONTENTS = [
		{ id: 'swap-overview', label: 'Swap overview' },
		{ id: 'step-references', label: 'References' },
		{ id: 'during-step', label: 'During this step' },
		{ id: 'handoff-checks', label: 'Handoff checks' },
		{ id: 'equipment', label: 'Equipment' },
		{ id: 'unique-items', label: 'Unique items' },
		{ id: 'skill-gems', label: 'Skill gems' },
		{ id: 'build-notes', label: 'Build notes' }
	];

	let guide = $state<BuildGuide>(cloneGuide(sampleGuides[0]));
	let activeStepId = $state(sampleGuides[0].steps[0].id);
	let importUrl = $state(TRANSITION_POB_URL);
	let importMessage = $state('');
	let importing = $state(false);
	let ready = $state(false);
	let priceSnapshot = $state<PoeNinjaPriceSnapshot | null>(null);
	let priceStatus = $state<'loading' | 'ready' | 'unavailable'>('loading');
	let tierSnapshot = $state<UniqueTierSnapshot | null>(null);
	let tierStatus = $state<'loading' | 'ready' | 'unavailable'>('loading');
	let savedBuilds = $state<SavedBuildRecord[]>([]);
	let activeSavedBuildId = $state<string | null>(null);
	let workspaceSource = $state<'template' | 'saved' | 'shared'>('template');
	let savedBuildName = $state(sampleGuides[0].name);
	let libraryMessage = $state('');
	let shareUrl = $state('');
	let sharing = $state(false);
	let activeToolTab = $state<'build-steps' | 'uniques' | 'compare'>('build-steps');
	let showBuildLibrary = $state(false);
	let buildLibraryButton = $state<HTMLButtonElement>();
	let buildLibraryCloseButton = $state<HTMLButtonElement>();
	let editingStepDetails = $state(false);
	let creatingStep = $state(false);
	let stepTitleInput = $state<HTMLInputElement>();
	let stepDraft = $state({
		title: '',
		eyebrow: '',
		description: '',
		level: 1,
		allocatedPassivePoints: 0
	});

	let activeIndex = $derived(guide.steps.findIndex((step) => step.id === activeStepId));
	let activeStep = $derived(guide.steps[Math.max(activeIndex, 0)]);
	let previousStep = $derived(activeIndex > 0 ? guide.steps[activeIndex - 1] : null);
	let pathOfBuildingUrl = $derived(buildPathOfBuildingUrl(guide.sourceUrl));
	let allTodos = $derived(guide.steps.flatMap((step) => step.todos));
	let completedCount = $derived(allTodos.filter((todo) => todo.done).length);
	let overallProgress = $derived(
		allTodos.length ? Math.round((completedCount / allTodos.length) * 100) : 0
	);

	const storageKey = (guideId: string) => `atlas-step:guide:${guideId}`;
	const cloneStep = (step: GuideStep): GuideStep => JSON.parse(JSON.stringify(step)) as GuideStep;

	function mergeGuideProgress(
		baseGuide: BuildGuide,
		savedSteps: BuildGuide['steps'],
		optionalUniques: GuideOptionalUnique[] = []
	): BuildGuide {
		const baseById = new Map(baseGuide.steps.map((step) => [step.id, step]));
		const savedIds = new Set(savedSteps.map((step) => step.id));
		const nextGuide = cloneGuide(baseGuide);
		const orderedSavedSteps = savedSteps.map((savedStep) => {
			const baseStep = baseById.get(savedStep.id);
			if (!baseStep) return cloneStep(savedStep);

			return {
				...baseStep,
				title: savedStep.title,
				eyebrow: savedStep.eyebrow,
				description: savedStep.description,
				...(savedStep.level !== undefined ? { level: savedStep.level } : {}),
				...(savedStep.allocatedPassivePoints !== undefined
					? { allocatedPassivePoints: savedStep.allocatedPassivePoints }
					: {}),
				...(savedStep.insights !== undefined ? { insights: savedStep.insights } : {}),
				todos: mergeSavedTodos(baseStep.todos, savedStep.todos)
			};
		});
		const newBundledSteps = nextGuide.steps.filter((step) => !savedIds.has(step.id));
		nextGuide.steps = [...orderedSavedSteps, ...newBundledSteps];
		nextGuide.optionalUniques = optionalUniques
			.filter((item) => nextGuide.steps.some((step) => step.id === item.stepId))
			.map((item) => ({ ...item }));
		return nextGuide;
	}

	function refreshBundledGuide(savedGuide: BuildGuide) {
		const baseGuide = sampleGuides.find(
			(candidate) => candidate.id === savedGuide.id && candidate.sourceUrl === savedGuide.sourceUrl
		);
		return baseGuide
			? mergeGuideProgress(baseGuide, savedGuide.steps, savedGuide.optionalUniques)
			: clonePlainGuide(savedGuide);
	}

	function loadSavedGuide(baseGuide: BuildGuide) {
		if (typeof localStorage === 'undefined') return cloneGuide(baseGuide);
		const saved = localStorage.getItem(storageKey(baseGuide.id));
		if (!saved) return cloneGuide(baseGuide);
		try {
			const parsed = JSON.parse(saved) as
				| BuildGuide['steps']
				| {
						steps: BuildGuide['steps'];
						optionalUniques?: GuideOptionalUnique[];
				  };
			const savedSteps = Array.isArray(parsed) ? parsed : parsed.steps;
			const optionalUniques = Array.isArray(parsed) ? [] : (parsed.optionalUniques ?? []);
			return mergeGuideProgress(baseGuide, savedSteps, optionalUniques);
		} catch {
			return cloneGuide(baseGuide);
		}
	}

	function mergeSavedTodos(
		defaultTodos: BuildGuide['steps'][number]['todos'],
		savedTodos: BuildGuide['steps'][number]['todos']
	) {
		const defaultById = new Map(defaultTodos.map((todo) => [todo.id, todo]));
		const savedIds = new Set(savedTodos.map((todo) => todo.id));
		const orderedSavedTodos = savedTodos.flatMap((savedTodo) => {
			const defaultTodo = defaultById.get(savedTodo.id);
			if (defaultTodo) {
				return [
					{
						...defaultTodo,
						text: savedTodo.text,
						phase: savedTodo.phase,
						done: savedTodo.done
					}
				];
			}
			return savedTodo.id.startsWith('custom-') ? [savedTodo] : [];
		});
		const newDefaultTodos = defaultTodos.filter((todo) => !savedIds.has(todo.id));
		return [...orderedSavedTodos, ...newDefaultTodos];
	}

	async function loadPriceSnapshot() {
		priceStatus = 'loading';
		try {
			const response = await fetch(`${base}/data/poe-ninja-prices.json`, { cache: 'no-store' });
			if (!response.ok) throw new Error(`Price snapshot returned ${response.status}`);
			const nextSnapshot = (await response.json()) as PoeNinjaPriceSnapshot;
			if (!nextSnapshot.league || !nextSnapshot.prices) throw new Error('Invalid price snapshot');
			priceSnapshot = nextSnapshot;
			priceStatus = 'ready';
		} catch {
			priceSnapshot = null;
			priceStatus = 'unavailable';
		}
	}

	async function loadTierSnapshot() {
		tierStatus = 'loading';
		try {
			const response = await fetch(`${base}/data/unique-tiers.json`, { cache: 'no-store' });
			if (!response.ok) throw new Error(`Tier snapshot returned ${response.status}`);
			const nextSnapshot = (await response.json()) as UniqueTierSnapshot;
			if (!nextSnapshot.source || !nextSnapshot.tiers) throw new Error('Invalid tier snapshot');
			tierSnapshot = nextSnapshot;
			tierStatus = 'ready';
		} catch {
			tierSnapshot = null;
			tierStatus = 'unavailable';
		}
	}

	async function initializeWorkspace() {
		const storedBuilds = readSavedBuilds();
		const refreshedBuilds = storedBuilds.map((savedBuild) => ({
			...savedBuild,
			guide: refreshBundledGuide(savedBuild.guide)
		}));
		savedBuilds = refreshedBuilds;
		if (JSON.stringify(storedBuilds) !== JSON.stringify(refreshedBuilds)) {
			writeSavedBuilds(refreshedBuilds);
		}
		const shareToken = readSharedBuildToken(window.location.hash);

		if (shareToken) {
			try {
				const shared = await decodeSharedBuild(shareToken);
				guide = refreshBundledGuide(shared.guide);
				activeStepId = shared.activeStepId;
				importUrl = guide.sourceUrl;
				savedBuildName = `${shared.name} copy`;
				workspaceSource = 'shared';
				libraryMessage = `Loaded “${shared.name}” from a share link. Save a local copy to keep your changes.`;
			} catch {
				guide = loadSavedGuide(sampleGuides[0]);
				activeStepId = guide.steps[0].id;
				libraryMessage =
					'That shared build link could not be read. Loaded the default build instead.';
			}

			window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
		} else {
			guide = loadSavedGuide(sampleGuides[0]);
			activeStepId = guide.steps[0].id;
		}

		ready = true;
		void loadPriceSnapshot();
		void loadTierSnapshot();
	}

	onMount(() => {
		void initializeWorkspace();
	});

	$effect(() => {
		if (!ready || typeof localStorage === 'undefined') return;
		const workspace = JSON.stringify({ guide, activeStepId });

		if (workspaceSource === 'template') {
			localStorage.setItem(
				storageKey(guide.id),
				JSON.stringify({
					steps: guide.steps,
					optionalUniques: guide.optionalUniques ?? []
				})
			);
			return;
		}

		if (workspaceSource === 'saved' && activeSavedBuildId) {
			const snapshot = JSON.parse(workspace) as {
				guide: BuildGuide;
				activeStepId: string;
			};
			const currentBuilds = untrack(() => savedBuilds);
			const now = new Date().toISOString();
			const nextBuilds = currentBuilds.map((build) =>
				build.id === activeSavedBuildId
					? {
							...build,
							guide: snapshot.guide,
							activeStepId: snapshot.activeStepId,
							updatedAt: now
						}
					: build
			);
			if (writeSavedBuilds(nextBuilds)) {
				savedBuilds = nextBuilds;
			}
		}
	});

	function selectGuide(nextGuide: BuildGuide) {
		editingStepDetails = false;
		guide = loadSavedGuide(nextGuide);
		activeStepId = guide.steps[0].id;
		activeSavedBuildId = null;
		workspaceSource = 'template';
		savedBuildName = guide.name;
		shareUrl = '';
		importUrl = guide.sourceUrl;
		importMessage = `Loaded ${guide.steps.length} loadouts from the saved MVP profile.`;
	}

	function saveCurrentBuild(name: string) {
		const trimmedName = name.trim();
		if (!trimmedName) {
			libraryMessage = 'Give this build a name before saving it.';
			return;
		}

		const now = new Date().toISOString();
		const savedBuild: SavedBuildRecord = {
			id: createSavedBuildId(),
			name: trimmedName,
			guide: clonePlainGuide(guide),
			activeStepId,
			createdAt: now,
			updatedAt: now
		};

		const nextBuilds = [savedBuild, ...savedBuilds];
		if (!writeSavedBuilds(nextBuilds)) {
			libraryMessage = 'This build could not be saved. Browser storage may be full or unavailable.';
			return;
		}

		savedBuilds = nextBuilds;
		activeSavedBuildId = savedBuild.id;
		workspaceSource = 'saved';
		savedBuildName = savedBuild.name;
		shareUrl = '';
		libraryMessage = `Saved “${savedBuild.name}”. Future changes to this copy save automatically.`;
	}

	function loadSavedBuild(savedBuild: SavedBuildRecord) {
		editingStepDetails = false;
		guide = refreshBundledGuide(savedBuild.guide);
		activeStepId = guide.steps.some((step) => step.id === savedBuild.activeStepId)
			? savedBuild.activeStepId
			: guide.steps[0].id;
		activeSavedBuildId = savedBuild.id;
		workspaceSource = 'saved';
		savedBuildName = savedBuild.name;
		importUrl = guide.sourceUrl;
		importMessage = '';
		shareUrl = '';
		libraryMessage = `Loaded “${savedBuild.name}”. Changes save automatically on this device.`;
	}

	function deleteSavedBuild(savedBuild: SavedBuildRecord) {
		if (!window.confirm(`Delete “${savedBuild.name}” from this device?`)) return;

		const nextBuilds = savedBuilds.filter((build) => build.id !== savedBuild.id);
		if (!writeSavedBuilds(nextBuilds)) {
			libraryMessage = `Could not delete “${savedBuild.name}” from browser storage.`;
			return;
		}
		savedBuilds = nextBuilds;

		if (activeSavedBuildId === savedBuild.id) {
			activeSavedBuildId = null;
			workspaceSource = 'shared';
			libraryMessage = `Deleted “${savedBuild.name}”. The open copy remains available until you leave or save it again.`;
			return;
		}

		libraryMessage = `Deleted “${savedBuild.name}” from this device.`;
	}

	async function copyShareUrl(successMessage = 'Share link copied to your clipboard.') {
		if (!shareUrl) return false;
		try {
			await navigator.clipboard.writeText(shareUrl);
			libraryMessage = successMessage;
			return true;
		} catch {
			libraryMessage = 'The share link is ready. Select it and copy it manually.';
			return false;
		}
	}

	async function shareCurrentBuild() {
		sharing = true;
		try {
			const activeName =
				savedBuilds.find((build) => build.id === activeSavedBuildId)?.name ??
				savedBuildName.trim() ??
				guide.name;
			const token = await encodeSharedBuild({
				version: 1,
				name: activeName || guide.name,
				guide: clonePlainGuide(guide),
				activeStepId
			});
			const fullShareUrl = createShareUrl(token, window.location.href);
			try {
				shareUrl = await shortenShareUrl(fullShareUrl);
				await copyShareUrl('Short share link copied to your clipboard.');
			} catch {
				shareUrl = fullShareUrl;
				await copyShareUrl(
					'Spoo.me could not shorten this build, so the full share link was copied instead.'
				);
			}
		} catch {
			libraryMessage = 'Could not generate a share link for this build.';
		} finally {
			sharing = false;
		}
	}

	async function importBuild(event: SubmitEvent) {
		event.preventDefault();
		if (importing) return;
		const found = findGuideByUrl(importUrl);
		if (found) {
			selectGuide(found);
			return;
		}

		importing = true;
		importMessage = 'Reading the Path of Building and assembling an editable baseline…';

		try {
			const imported = await importPobbBuild(importUrl);
			editingStepDetails = false;
			guide = imported.guide;
			activeStepId = imported.guide.steps[0].id;
			activeSavedBuildId = null;
			workspaceSource = 'shared';
			savedBuildName = imported.guide.name;
			shareUrl = '';
			importUrl = imported.guide.sourceUrl;
			libraryMessage =
				'Imported an editable baseline. Save a local copy before leaving if you want to keep your changes.';
			importMessage = `Imported ${imported.summary.loadoutCount} loadouts with ${imported.summary.equipmentCount} equipment entries, ${imported.summary.gemCount} gems, ${imported.summary.uniqueCount} unique references, and ${imported.summary.noteCount} note sections.`;
		} catch (error) {
			importMessage =
				error instanceof Error
					? error.message
					: 'This Path of Building could not be imported. Check the link and try again.';
		} finally {
			importing = false;
		}
	}

	function toggleTodo(todoId: string) {
		const item = activeStep.todos.find((todo) => todo.id === todoId);
		if (item) item.done = !item.done;
	}

	function editTodo(todoId: string, text: string) {
		const item = activeStep.todos.find((todo) => todo.id === todoId);
		if (item) item.text = text;
	}

	function deleteTodo(todoId: string) {
		activeStep.todos = activeStep.todos.filter((todo) => todo.id !== todoId);
	}

	function addTodo(text: string, phase: TodoPhase) {
		activeStep.todos.push({
			id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			text,
			phase,
			done: false
		});
	}

	function reorderTodo(
		phase: TodoPhase,
		draggedId: string,
		targetId: string,
		placement: 'before' | 'after'
	) {
		const phaseItems = activeStep.todos.filter((todo) => todo.phase === phase);
		const sourceIndex = phaseItems.findIndex((todo) => todo.id === draggedId);
		const targetIndex = phaseItems.findIndex((todo) => todo.id === targetId);
		if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

		const [movedItem] = phaseItems.splice(sourceIndex, 1);
		let insertionIndex = targetIndex;
		if (sourceIndex < targetIndex) insertionIndex -= 1;
		if (placement === 'after') insertionIndex += 1;
		phaseItems.splice(insertionIndex, 0, movedItem);

		let nextPhaseIndex = 0;
		activeStep.todos = activeStep.todos.map((todo) =>
			todo.phase === phase ? phaseItems[nextPhaseIndex++] : todo
		);
	}

	function addInsight(insight: GuideInsight) {
		if (!activeStep.insights) activeStep.insights = [];
		activeStep.insights.push(insight);
	}

	function editInsight(index: number, insight: GuideInsight) {
		if (!activeStep.insights?.[index]) return;
		activeStep.insights[index] = insight;
	}

	function deleteInsight(index: number) {
		if (!activeStep.insights?.[index]) return;
		activeStep.insights = activeStep.insights.filter((_, insightIndex) => insightIndex !== index);
	}

	async function openStepEditor() {
		stepDraft = {
			title: activeStep.title,
			eyebrow: activeStep.eyebrow,
			description: activeStep.description,
			level: activeStep.level ?? guide.level,
			allocatedPassivePoints: activeStep.allocatedPassivePoints ?? 0
		};
		creatingStep = false;
		editingStepDetails = true;
		await tick();
		stepTitleInput?.focus();
	}

	async function openNewStepEditor() {
		if (guide.steps.length >= 50) return;
		stepDraft = {
			title: 'New section',
			eyebrow: 'Custom step',
			description: 'Describe what needs to happen during this part of the progression.',
			level: activeStep.level ?? guide.level,
			allocatedPassivePoints: activeStep.allocatedPassivePoints ?? 0
		};
		creatingStep = true;
		editingStepDetails = true;
		await tick();
		document.getElementById('step-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		stepTitleInput?.focus();
		stepTitleInput?.select();
	}

	function closeStepEditor() {
		editingStepDetails = false;
		creatingStep = false;
	}

	function saveStepDetails(event: SubmitEvent) {
		event.preventDefault();
		const title = stepDraft.title.trim();
		const eyebrow = stepDraft.eyebrow.trim();
		const description = stepDraft.description.trim();
		const level = Math.round(stepDraft.level);
		const allocatedPassivePoints = Math.round(stepDraft.allocatedPassivePoints);
		if (
			!title ||
			!eyebrow ||
			!description ||
			!Number.isInteger(level) ||
			level < 1 ||
			level > 100 ||
			!Number.isInteger(allocatedPassivePoints) ||
			allocatedPassivePoints < 0 ||
			allocatedPassivePoints > 200
		) {
			return;
		}

		if (creatingStep) {
			const id =
				typeof crypto !== 'undefined' && 'randomUUID' in crypto
					? `custom-step-${crypto.randomUUID()}`
					: `custom-step-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			const newStep: BuildGuide['steps'][number] = {
				id,
				title,
				eyebrow,
				description,
				level,
				allocatedPassivePoints,
				uniques: [],
				equipment: [],
				gems: [],
				insights: [],
				noteHighlights: [],
				todos: []
			};
			const insertAt = Math.min(activeIndex + 1, guide.steps.length);
			guide.steps.splice(insertAt, 0, newStep);
			activeStepId = id;
		} else {
			activeStep.title = title;
			activeStep.eyebrow = eyebrow;
			activeStep.description = description;
			activeStep.level = level;
			activeStep.allocatedPassivePoints = allocatedPassivePoints;
		}

		editingStepDetails = false;
		creatingStep = false;
	}

	function selectStep(stepId: string) {
		editingStepDetails = false;
		creatingStep = false;
		activeStepId = stepId;
	}

	function scrollToSection(sectionId: string) {
		document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function resetGuide() {
		const original = sampleGuides.find((item) => item.id === guide.id);
		if (!original) return;
		editingStepDetails = false;
		guide = cloneGuide(original);
		activeStepId = guide.steps[0].id;
		if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey(guide.id));
	}

	function navigateStep(direction: -1 | 1) {
		const nextIndex = Math.min(Math.max(activeIndex + direction, 0), guide.steps.length - 1);
		editingStepDetails = false;
		creatingStep = false;
		activeStepId = guide.steps[nextIndex].id;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function reorderStep(direction: -1 | 1) {
		const targetIndex = activeIndex + direction;
		if (activeIndex < 0 || targetIndex < 0 || targetIndex >= guide.steps.length) return;

		const [step] = guide.steps.splice(activeIndex, 1);
		guide.steps.splice(targetIndex, 0, step);
	}

	function addOptionalUnique(item: GuideOptionalUnique) {
		if (!guide.optionalUniques) guide.optionalUniques = [];
		guide.optionalUniques.push(item);
	}

	function updateOptionalUnique(
		itemId: string,
		updates: Pick<GuideOptionalUnique, 'stepId' | 'note'>
	) {
		const item = guide.optionalUniques?.find((candidate) => candidate.id === itemId);
		if (!item || !guide.steps.some((step) => step.id === updates.stepId)) return;
		item.stepId = updates.stepId;
		item.note = updates.note;
	}

	function deleteOptionalUnique(itemId: string) {
		guide.optionalUniques = (guide.optionalUniques ?? []).filter((item) => item.id !== itemId);
	}

	async function openBuildLibrary() {
		showBuildLibrary = true;
		await tick();
		buildLibraryCloseButton?.focus();
	}

	async function closeBuildLibrary() {
		showBuildLibrary = false;
		await tick();
		buildLibraryButton?.focus();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showBuildLibrary) void closeBuildLibrary();
	}

	async function openUniqueStep(stepId: string) {
		selectStep(stepId);
		activeToolTab = 'build-steps';
		await tick();
		document.getElementById('step-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<svelte:head>
	<title>{SITE_TITLE}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta name="application-name" content="Atlas Step" />
	<meta name="theme-color" content="#080b12" />
	<link rel="canonical" href={SITE_URL} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Atlas Step" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content={SITE_TITLE} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:image" content={SOCIAL_IMAGE_URL} />
	<meta property="og:image:secure_url" content={SOCIAL_IMAGE_URL} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Atlas Step progression rail, checklist, and equipment cards on a dark cyan and amber interface."
	/>

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
	<meta
		name="twitter:image:alt"
		content="Atlas Step progression rail, checklist, and equipment cards on a dark cyan and amber interface."
	/>
</svelte:head>

<div class="min-h-screen bg-[#080b12] text-slate-200">
	<div
		class="pointer-events-none fixed inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_50%_-20%,rgba(34,211,238,0.13),transparent_62%)]"
	></div>

	<header
		inert={showBuildLibrary}
		class="relative border-b border-slate-800/90 bg-[#0b0f18]/90 backdrop-blur-xl"
	>
		<div
			class="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
		>
			<div class="flex items-center gap-3">
				<div
					class="grid size-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-300"
				>
					<AtomOutline class="size-5" />
				</div>
				<div>
					<p class="text-base font-bold tracking-tight text-white">Atlas Step</p>
					<p class="text-xs text-slate-500">A calmer path through league progression</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="hidden lg:inline-flex"><Badge color="cyan" rounded>3.29 plan</Badge></span>
				<button
					bind:this={buildLibraryButton}
					type="button"
					onclick={openBuildLibrary}
					aria-haspopup="dialog"
					aria-expanded={showBuildLibrary}
					class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
				>
					<BookmarkOutline class="size-4" />
					<span class="hidden sm:inline">Builds</span>
					<span
						class="grid min-w-5 place-items-center rounded-full bg-slate-800 px-1.5 py-0.5 text-[0.6rem] text-slate-500"
					>
						{savedBuilds.length}
					</span>
				</button>
				<a
					href="https://github.com/CollinHerber/poe-build-tool"
					target="_blank"
					rel="noreferrer"
					aria-label="View Atlas Step on GitHub"
					class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
				>
					<GithubSolid class="size-4" />
					<span class="hidden sm:inline">GitHub</span>
				</a>
				<a
					href="https://www.pathofexile.com/"
					target="_blank"
					rel="noreferrer"
					class="hidden text-xs font-medium text-slate-500 transition hover:text-slate-300 sm:inline"
					>Path of Exile ↗</a
				>
			</div>
		</div>
	</header>

	{#if showBuildLibrary}
		<div
			class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:p-6"
			role="presentation"
			onclick={(event) => {
				if (event.target === event.currentTarget) void closeBuildLibrary();
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Build library"
				class="my-auto max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0b101a] p-4 shadow-2xl shadow-black/50 sm:max-h-[calc(100vh-3rem)] sm:p-6"
			>
				<div class="mb-3 flex justify-end">
					<button
						bind:this={buildLibraryCloseButton}
						type="button"
						onclick={closeBuildLibrary}
						aria-label="Close build library"
						class="grid size-9 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
					>
						<CloseOutline class="size-4" />
					</button>
				</div>
				<BuildLibrary
					builds={savedBuilds}
					activeBuildId={activeSavedBuildId}
					bind:buildName={savedBuildName}
					{shareUrl}
					message={libraryMessage}
					{sharing}
					onSave={saveCurrentBuild}
					onLoad={(build) => {
						loadSavedBuild(build);
						void closeBuildLibrary();
					}}
					onDelete={deleteSavedBuild}
					onShare={shareCurrentBuild}
					onCopy={() => void copyShareUrl()}
				/>
			</div>
		</div>
	{/if}

	<main
		inert={showBuildLibrary}
		class="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
	>
		<div
			class="mb-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-1"
			aria-label="Atlas Step tools"
		>
			<button
				type="button"
				aria-pressed={activeToolTab === 'build-steps'}
				onclick={() => (activeToolTab = 'build-steps')}
				class={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
					activeToolTab === 'build-steps'
						? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/20'
						: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
				}`}
			>
				<ListOutline class="size-4" /> Build Steps
			</button>
			<button
				type="button"
				aria-pressed={activeToolTab === 'uniques'}
				onclick={() => (activeToolTab = 'uniques')}
				class={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
					activeToolTab === 'uniques'
						? 'bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/20'
						: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
				}`}
			>
				<StarOutline class="size-4" /> Uniques
			</button>
			<button
				type="button"
				aria-pressed={activeToolTab === 'compare'}
				onclick={() => (activeToolTab = 'compare')}
				class={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
					activeToolTab === 'compare'
						? 'bg-violet-300 text-slate-950 shadow-lg shadow-violet-950/20'
						: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
				}`}
			>
				<ArrowRightOutline class="size-4" /> Compare
			</button>
		</div>

		<section
			class:hidden={activeToolTab !== 'build-steps'}
			class="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/20"
		>
			<div class="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
				<div class="flex flex-wrap items-center gap-2">
					<Badge color="gray" rounded>Winter Orb</Badge>
					<Badge color="gray" rounded>{guide.className}</Badge>
					<span class="text-xs text-slate-600">Source PoB {guide.buildVersion}</span>
				</div>
				<div class="min-w-56 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
					<div class="flex items-end justify-between">
						<span class="text-xs font-semibold tracking-wider text-slate-500 uppercase"
							>League journey</span
						>
						<span class="text-lg font-bold text-cyan-300">{overallProgress}%</span>
					</div>
					<Progressbar progress={overallProgress} size="h-2" color="cyan" class="mt-3" />
					<p class="mt-2 text-xs text-slate-600">
						{completedCount} of {allTodos.length} checklist items complete
					</p>
				</div>
			</div>

			<form onsubmit={importBuild} class="border-t border-slate-800 bg-slate-950/30 p-4 sm:px-6">
				<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
					<label
						for="pob-url"
						class="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-300"
					>
						<LinkOutline class="size-4 text-cyan-400" /> Import Path of Building
					</label>
					<div class="flex min-w-0 flex-1 gap-2">
						<input
							id="pob-url"
							type="url"
							bind:value={importUrl}
							disabled={importing}
							class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
							placeholder="https://pobb.in/…"
						/>
						<Button type="submit" color="cyan" disabled={importing} class="whitespace-nowrap">
							{importing ? 'Importing…' : 'Build guide'}
						</Button>
					</div>
				</div>
				{#if importMessage}
					<p class="mt-2 text-xs text-slate-500" role="status">{importMessage}</p>
				{/if}
				<p class="mt-1 text-[0.65rem] text-slate-700">
					Public pobb.in data is read through Jina Reader because pobb.in blocks direct browser
					access from static sites.
				</p>
			</form>
		</section>

		<div class:hidden={activeToolTab !== 'build-steps'} class="mb-5 lg:hidden">
			<div class="mb-2 flex items-center justify-between gap-3">
				<span class="text-xs font-semibold tracking-wider text-slate-600 uppercase">Steps</span>
				<button
					type="button"
					onclick={openNewStepEditor}
					disabled={guide.steps.length >= 50}
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<PlusOutline class="size-3.5" /> Add section
				</button>
			</div>
			<ProgressRail steps={guide.steps} {activeStepId} onSelect={selectStep} />
		</div>

		<div
			class:hidden={activeToolTab !== 'build-steps'}
			class="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)_250px]"
		>
			<aside class="hidden lg:block">
				<div class="sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
					<div class="mb-4 flex items-center justify-between px-2">
						<div>
							<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
								Build path
							</p>
							<h2 class="mt-1 text-sm font-semibold text-slate-100">{guide.name}</h2>
						</div>
						<span
							class="rounded-md border border-slate-700 px-2 py-1 text-[0.65rem] font-bold text-slate-500"
						>
							LVL {guide.level}
						</span>
					</div>
					<ProgressRail steps={guide.steps} {activeStepId} onSelect={selectStep} />
					<button
						type="button"
						onclick={openNewStepEditor}
						disabled={guide.steps.length >= 50}
						class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-cyan-400/50 hover:bg-cyan-400/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<PlusOutline class="size-4" /> Add section
					</button>
				</div>
			</aside>

			<div class="min-w-0 space-y-5">
				<section
					id="step-details"
					class="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/45 p-5 sm:p-7"
				>
					<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
						{#if editingStepDetails}
							<form onsubmit={saveStepDetails} class="min-w-0 xl:col-span-2">
								{#if creatingStep}
									<p class="mb-4 text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
										Add after {activeStep.title}
									</p>
								{/if}
								<div class="grid gap-4">
									<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
										Section label
										<input
											bind:value={stepDraft.eyebrow}
											required
											maxlength="300"
											placeholder="Life-based baseline"
											class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
										/>
									</label>
									<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
										Section title
										<input
											bind:this={stepTitleInput}
											bind:value={stepDraft.title}
											required
											maxlength="300"
											class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base font-semibold text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
										/>
									</label>
									<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
										Section description
										<textarea
											bind:value={stepDraft.description}
											required
											maxlength="4000"
											rows="3"
											class="resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm leading-6 font-normal text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
										></textarea>
									</label>
									<div class="grid gap-4 sm:grid-cols-2">
										<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
											Approximate character level
											<input
												type="number"
												bind:value={stepDraft.level}
												required
												min="1"
												max="100"
												class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
											/>
										</label>
										<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
											Allocated passive points
											<input
												type="number"
												bind:value={stepDraft.allocatedPassivePoints}
												required
												min="0"
												max="200"
												class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
											/>
										</label>
									</div>
								</div>
								<div class="mt-4 flex flex-wrap gap-2">
									<button
										type="submit"
										class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
									>
										<CheckOutline class="size-3.5" />
										{creatingStep ? 'Add section' : 'Save section'}
									</button>
									<button
										type="button"
										onclick={closeStepEditor}
										class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
									>
										<CloseOutline class="size-3.5" /> Cancel
									</button>
								</div>
							</form>
						{:else}
							<div class="min-w-0">
								<p class="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
									Step {activeIndex + 1} of {guide.steps.length} · {activeStep.eyebrow}
								</p>
								<h2 class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
									{activeStep.title}
								</h2>
								{#if activeStep.level !== undefined || activeStep.allocatedPassivePoints !== undefined}
									<div class="mt-3 flex flex-wrap items-center gap-2">
										{#if activeStep.level !== undefined}
											<span
												class="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950/55 px-2.5 py-1.5 text-xs font-semibold text-slate-300"
												title="Approximate character level calculated from this loadout's passive tree"
											>
												Around level {activeStep.level}
											</span>
										{/if}
										{#if activeStep.allocatedPassivePoints !== undefined}
											<!-- External PoB URLs must not use SvelteKit's internal route resolver. -->
											<!-- eslint-disable svelte/no-navigation-without-resolve -->
											<a
												href={guide.sourceUrl}
												target="_blank"
												rel="noreferrer"
												class="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
												title="Open the source Path of Building passive tree"
											>
												{activeStep.allocatedPassivePoints} allocated passives
												<ArrowUpRightFromSquareOutline class="size-3.5" />
											</a>
											<!-- eslint-enable svelte/no-navigation-without-resolve -->
										{/if}
									</div>
								{/if}
							</div>
						{/if}
						<div
							class={`flex shrink-0 flex-wrap items-center gap-2 ${
								editingStepDetails ? 'xl:col-span-2' : 'xl:justify-end'
							}`}
						>
							{#if !editingStepDetails}
								<div
									class="inline-flex overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
									role="group"
									aria-label={`Reorder ${activeStep.title} section`}
								>
									<button
										type="button"
										onclick={() => reorderStep(-1)}
										disabled={activeIndex <= 0}
										title="Move section earlier"
										aria-label={`Move ${activeStep.title} earlier`}
										class="grid size-8 place-items-center text-slate-400 transition hover:bg-slate-800 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
									>
										<ArrowUpOutline class="size-3.5" />
									</button>
									<button
										type="button"
										onclick={() => reorderStep(1)}
										disabled={activeIndex >= guide.steps.length - 1}
										title="Move section later"
										aria-label={`Move ${activeStep.title} later`}
										class="grid size-8 place-items-center border-l border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
									>
										<ArrowDownOutline class="size-3.5" />
									</button>
								</div>
								<button
									type="button"
									onclick={openStepEditor}
									class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
									aria-label={`Edit ${activeStep.title} section details`}
								>
									<EditOutline class="size-3.5" /> Edit section
								</button>
							{/if}
							{#if pathOfBuildingUrl}
								<!-- Custom protocol URLs must not use SvelteKit's internal route resolver. -->
								<!-- eslint-disable svelte/no-navigation-without-resolve -->
								<a
									href={pathOfBuildingUrl}
									aria-label={`Open ${guide.name} in Path of Building`}
									class="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/15 hover:text-cyan-200"
								>
									Open in Path of Building <ArrowUpRightFromSquareOutline class="size-3.5" />
								</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							{/if}
							<a
								href={guide.sourceUrl}
								target="_blank"
								rel="noreferrer"
								class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
							>
								Open source PoB <ArrowUpRightFromSquareOutline class="size-3.5" />
							</a>
						</div>
						{#if !editingStepDetails}
							<p class="w-full text-sm leading-7 text-slate-400 xl:col-span-2">
								{activeStep.description}
							</p>
						{/if}
					</div>
				</section>

				<StepTableOfContents sections={STEP_CONTENTS} onNavigate={scrollToSection} />

				<div id="swap-overview" class="scroll-mt-6">
					<StepSwapOverview
						stepTitle={activeStep.title}
						previousStepTitle={previousStep?.title}
						prerequisites={previousStep
							? previousStep.todos.filter((item) => item.phase === 'before-next')
							: activeStep.todos.filter((item) => item.phase === 'during')}
						currentItems={activeStep.equipment ?? []}
						previousItems={previousStep ? (previousStep.equipment ?? []) : null}
						currentUniques={activeStep.uniques}
						previousUniques={previousStep?.uniques ?? null}
						currentGemGroups={activeStep.gems ?? []}
						previousGemGroups={previousStep ? (previousStep.gems ?? []) : null}
					/>
				</div>

				{#key activeStep.id}
					<div id="step-references" class="scroll-mt-6">
						<StepInsights
							insights={activeStep.insights ?? []}
							onAdd={addInsight}
							onEdit={editInsight}
							onDelete={deleteInsight}
						/>
					</div>

					<div id="during-step" class="scroll-mt-6">
						<ChecklistSection
							title="Do during this step"
							description="Complete these actions while this loadout is your active setup."
							phase="during"
							items={activeStep.todos.filter((item) => item.phase === 'during')}
							onToggle={toggleTodo}
							onDelete={deleteTodo}
							onEdit={editTodo}
							onAdd={addTodo}
							onReorder={reorderTodo}
						/>
					</div>

					<div id="handoff-checks" class="scroll-mt-6">
						<ChecklistSection
							title={activeIndex >= guide.steps.length - 1
								? 'Final verification'
								: 'Before moving on'}
							description={activeIndex >= guide.steps.length - 1
								? 'Run these checks before treating the imported progression as complete.'
								: 'Verify this handoff before selecting the next Path of Building loadout.'}
							phase="before-next"
							items={activeStep.todos.filter((item) => item.phase === 'before-next')}
							onToggle={toggleTodo}
							onDelete={deleteTodo}
							onEdit={editTodo}
							onAdd={addTodo}
							onReorder={reorderTodo}
						/>
					</div>
				{/key}

				<div id="equipment" class="scroll-mt-6">
					<EquipmentSection
						items={activeStep.equipment ?? []}
						previousItems={previousStep ? (previousStep.equipment ?? []) : null}
						previousStepTitle={previousStep?.title}
						stepId={activeStep.id}
						snapshot={priceSnapshot}
						prioritySourceUrl={MAXROLL_URL}
					/>
				</div>

				<div id="unique-items" class="scroll-mt-6">
					<UniqueItemsSection
						items={activeStep.uniques}
						snapshot={priceSnapshot}
						status={priceStatus}
						{tierSnapshot}
						{tierStatus}
					/>
				</div>

				<div id="skill-gems" class="scroll-mt-6">
					<GemGroupsSection
						currentGroups={activeStep.gems ?? []}
						previousGroups={previousStep ? (previousStep.gems ?? []) : null}
						previousStepTitle={previousStep?.title}
					/>
				</div>

				<div id="build-notes" class="scroll-mt-6">
					<BuildNotesSection
						sections={guide.notes}
						highlights={activeStep.noteHighlights ?? []}
						sourceUrl={guide.sourceUrl}
					/>
				</div>

				<div class="flex items-center justify-between gap-3 pt-1">
					<Button
						type="button"
						color="dark"
						disabled={activeIndex <= 0}
						onclick={() => navigateStep(-1)}
						class="!border-slate-700 !bg-slate-900"
					>
						<ArrowLeftOutline class="mr-2 size-4" /> Previous
					</Button>
					<Button
						type="button"
						color="cyan"
						disabled={activeIndex >= guide.steps.length - 1}
						onclick={() => navigateStep(1)}
					>
						Next step <ArrowRightOutline class="ml-2 size-4" />
					</Button>
				</div>
			</div>

			<aside class="hidden xl:block">
				<div class="sticky top-6 max-h-[calc(100vh-3rem)] space-y-4 overflow-y-auto pr-1">
					<StepTableOfContents
						sections={STEP_CONTENTS}
						onNavigate={scrollToSection}
						variant="sidebar"
					/>

					<section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
						<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-slate-500 uppercase">
							How to use this step
						</p>
						<ol class="mt-3 space-y-3">
							<li class="flex gap-2.5 text-xs leading-5 text-slate-400">
								<span
									class="grid size-5 shrink-0 place-items-center rounded-full bg-cyan-400/10 text-[0.65rem] font-bold text-cyan-300"
									>1</span
								>
								Complete the active-step actions.
							</li>
							<li class="flex gap-2.5 text-xs leading-5 text-slate-400">
								<span
									class="grid size-5 shrink-0 place-items-center rounded-full bg-cyan-400/10 text-[0.65rem] font-bold text-cyan-300"
									>2</span
								>
								Use equipment and gem comparisons while making each change.
							</li>
							<li class="flex gap-2.5 text-xs leading-5 text-slate-400">
								<span
									class="grid size-5 shrink-0 place-items-center rounded-full bg-cyan-400/10 text-[0.65rem] font-bold text-cyan-300"
									>3</span
								>
								Pass every handoff check before moving forward.
							</li>
						</ol>
					</section>

					<section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
						<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-slate-500 uppercase">
							References
						</p>
						<div class="mt-3 space-y-2">
							<a
								href={TRANSITION_POB_URL}
								target="_blank"
								rel="noreferrer"
								class="flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-300"
							>
								<LinkOutline class="size-3.5" /> Source transition PoB
							</a>
							<a
								href={MAXROLL_URL}
								target="_blank"
								rel="noreferrer"
								class="flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-300"
							>
								<BookOpenOutline class="size-3.5" /> Maxroll guide
							</a>
							<a
								href={ZIZARAN_GUIDE_URL}
								target="_blank"
								rel="noreferrer"
								class="flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-300"
							>
								<BookOpenOutline class="size-3.5" /> Zizaran video guide
							</a>
							<a
								href={FUBGUN_GUIDE_URL}
								target="_blank"
								rel="noreferrer"
								class="flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-300"
							>
								<BookOpenOutline class="size-3.5" /> Fubgun video guide
							</a>
						</div>
					</section>

					<button
						type="button"
						onclick={resetGuide}
						class="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-900 hover:text-slate-400"
					>
						<RefreshOutline class="size-3.5" /> Reset current guide
					</button>
				</div>
			</aside>
		</div>
		{#if activeToolTab === 'uniques'}
			<div>
				<BuildUniquesDashboard
					{guide}
					snapshot={priceSnapshot}
					status={priceStatus}
					{tierSnapshot}
					{tierStatus}
					{activeStepId}
					onSelectStep={(stepId) => void openUniqueStep(stepId)}
					onAddOptional={addOptionalUnique}
					onUpdateOptional={updateOptionalUnique}
					onDeleteOptional={deleteOptionalUnique}
				/>
			</div>
		{/if}
		<div class:hidden={activeToolTab !== 'compare'}>
			<BuildCompare {guide} {activeStepId} />
		</div>
	</main>

	<footer
		inert={showBuildLibrary}
		class="relative mt-8 border-t border-slate-900 px-4 py-8 text-center text-xs text-slate-700"
	>
		Atlas Step is an independent planning tool and is not affiliated with Grinding Gear Games.
	</footer>
</div>
