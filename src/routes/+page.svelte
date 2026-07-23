<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { Badge, Button, Progressbar } from 'flowbite-svelte';
	import {
		ArrowLeftOutline,
		ArrowRightOutline,
		ArrowUpRightFromSquareOutline,
		AtomOutline,
		BookOpenOutline,
		LinkOutline,
		RefreshOutline
	} from 'flowbite-svelte-icons';
	import BuildNotesSection from '$lib/components/BuildNotesSection.svelte';
	import ProgressRail from '$lib/components/ProgressRail.svelte';
	import StepInsights from '$lib/components/StepInsights.svelte';
	import TodoSection from '$lib/components/TodoSection.svelte';
	import UniqueItemsSection from '$lib/components/UniqueItemsSection.svelte';
	import {
		FUBGUN_GUIDE_URL,
		MAXROLL_URL,
		PRIMARY_POB_URL,
		TRANSITION_POB_URL,
		ZIZARAN_GUIDE_URL,
		cloneGuide,
		findGuideByUrl,
		sampleGuides
	} from '$lib/data/sample-guides';
	import { buildPathOfBuildingUrl } from '$lib/poe/path-of-building';
	import type { BuildGuide, PoeNinjaPriceSnapshot, TodoPhase } from '$lib/types/guide';

	let guide = $state<BuildGuide>(cloneGuide(sampleGuides[0]));
	let activeStepId = $state(sampleGuides[0].steps[0].id);
	let importUrl = $state(PRIMARY_POB_URL);
	let importMessage = $state('');
	let ready = $state(false);
	let priceSnapshot = $state<PoeNinjaPriceSnapshot | null>(null);
	let priceStatus = $state<'loading' | 'ready' | 'unavailable'>('loading');

	let activeIndex = $derived(guide.steps.findIndex((step) => step.id === activeStepId));
	let activeStep = $derived(guide.steps[Math.max(activeIndex, 0)]);
	let pathOfBuildingUrl = $derived(buildPathOfBuildingUrl(guide.sourceUrl));
	let allTodos = $derived(guide.steps.flatMap((step) => step.todos));
	let completedCount = $derived(allTodos.filter((todo) => todo.done).length);
	let overallProgress = $derived(
		allTodos.length ? Math.round((completedCount / allTodos.length) * 100) : 0
	);

	const storageKey = (guideId: string) => `atlas-step:guide:${guideId}`;

	function loadSavedGuide(baseGuide: BuildGuide) {
		if (typeof localStorage === 'undefined') return cloneGuide(baseGuide);
		const saved = localStorage.getItem(storageKey(baseGuide.id));
		if (!saved) return cloneGuide(baseGuide);
		try {
			const savedSteps = JSON.parse(saved) as BuildGuide['steps'];
			const savedById = new Map(savedSteps.map((step) => [step.id, step]));
			const nextGuide = cloneGuide(baseGuide);
			nextGuide.steps = nextGuide.steps.map((step) => ({
				...step,
				todos: mergeSavedTodos(step.todos, savedById.get(step.id)?.todos ?? [])
			}));
			return nextGuide;
		} catch {
			return cloneGuide(baseGuide);
		}
	}

	function mergeSavedTodos(
		defaultTodos: BuildGuide['steps'][number]['todos'],
		savedTodos: BuildGuide['steps'][number]['todos']
	) {
		const defaultIds = new Set(defaultTodos.map((todo) => todo.id));
		const savedById = new Map(savedTodos.map((todo) => [todo.id, todo]));
		const mergedDefaults = defaultTodos.map((todo) => ({
			...todo,
			done: savedById.get(todo.id)?.done ?? todo.done
		}));
		const customTodos = savedTodos.filter(
			(todo) => todo.id.startsWith('custom-') && !defaultIds.has(todo.id)
		);
		return [...mergedDefaults, ...customTodos];
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

	onMount(() => {
		guide = loadSavedGuide(sampleGuides[0]);
		activeStepId = guide.steps[0].id;
		ready = true;
		void loadPriceSnapshot();
	});

	$effect(() => {
		if (!ready || typeof localStorage === 'undefined') return;
		localStorage.setItem(storageKey(guide.id), JSON.stringify(guide.steps));
	});

	function selectGuide(nextGuide: BuildGuide) {
		guide = loadSavedGuide(nextGuide);
		activeStepId = guide.steps[0].id;
		importUrl = guide.sourceUrl;
		importMessage = `Loaded ${guide.steps.length} loadouts from the saved MVP profile.`;
	}

	function importBuild(event: SubmitEvent) {
		event.preventDefault();
		const found = findGuideByUrl(importUrl);
		if (found) {
			selectGuide(found);
			return;
		}

		if (/^https?:\/\/(?:www\.)?pobb\.in\/[A-Za-z0-9_-]+\/?$/i.test(importUrl.trim())) {
			importMessage =
				'This PoB link is valid. Live extraction is the next integration; this scaffold currently includes the two supplied profiles.';
			return;
		}

		importMessage = 'Paste a full pobb.in link, for example https://pobb.in/your-build-id.';
	}

	function toggleTodo(todoId: string) {
		const item = activeStep.todos.find((todo) => todo.id === todoId);
		if (item) item.done = !item.done;
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

	function resetGuide() {
		const original = sampleGuides.find((item) => item.id === guide.id);
		if (!original) return;
		guide = cloneGuide(original);
		activeStepId = guide.steps[0].id;
		if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey(guide.id));
	}

	function moveStep(direction: -1 | 1) {
		const nextIndex = Math.min(Math.max(activeIndex + direction, 0), guide.steps.length - 1);
		activeStepId = guide.steps[nextIndex].id;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>Atlas Step — Path of Exile progression planner</title>
	<meta
		name="description"
		content="A loadout-driven Path of Exile progression planner for turning Path of Building checkpoints into achievable league goals."
	/>
</svelte:head>

<div class="min-h-screen bg-[#080b12] text-slate-200">
	<div
		class="pointer-events-none fixed inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_50%_-20%,rgba(34,211,238,0.13),transparent_62%)]"
	></div>

	<header class="relative border-b border-slate-800/90 bg-[#0b0f18]/90 backdrop-blur-xl">
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
				<Badge color="cyan" rounded>3.29 plan</Badge>
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

	<main class="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
		<section
			class="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/20"
		>
			<div class="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
				<div>
					<div class="mb-3 flex flex-wrap items-center gap-2">
						<Badge color="gray" rounded>Winter Orb</Badge>
						<Badge color="gray" rounded>{guide.className}</Badge>
						<span class="text-xs text-slate-600">Source PoB {guide.buildVersion}</span>
					</div>
					<h1 class="max-w-3xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Turn the build into a path you can finish.
					</h1>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
						Every Path of Building loadout becomes a checkpoint. Add the work that matters, keep the
						upgrade in front of you, and always know what “ready for the next step” means.
					</p>
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
						{completedCount} of {allTodos.length} goals complete
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
							class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
							placeholder="https://pobb.in/…"
						/>
						<Button type="submit" color="cyan" class="whitespace-nowrap">Build guide</Button>
					</div>
				</div>
				{#if importMessage}
					<p class="mt-2 text-xs text-slate-500" role="status">{importMessage}</p>
				{/if}
			</form>
		</section>

		<div class="mb-5 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
			<span class="shrink-0 text-xs font-semibold tracking-wider text-slate-600 uppercase"
				>Steps</span
			>
			<ProgressRail steps={guide.steps} {activeStepId} onSelect={(id) => (activeStepId = id)} />
		</div>

		<div
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
					<ProgressRail steps={guide.steps} {activeStepId} onSelect={(id) => (activeStepId = id)} />
				</div>
			</aside>

			<div class="min-w-0 space-y-5">
				<section class="rounded-2xl border border-slate-800 bg-slate-900/45 p-5 sm:p-7">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p class="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
								Step {activeIndex + 1} of {guide.steps.length} · {activeStep.eyebrow}
							</p>
							<h2 class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
								{activeStep.title}
							</h2>
							<p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
								{activeStep.description}
							</p>
						</div>
						<div class="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
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
					</div>
				</section>

				<StepInsights insights={activeStep.insights ?? []} />

				<UniqueItemsSection
					items={activeStep.uniques}
					snapshot={priceSnapshot}
					status={priceStatus}
				/>

				<TodoSection
					title="During this step"
					description="The work to focus on while this loadout is your active checkpoint."
					phase="during"
					todos={activeStep.todos.filter((todo) => todo.phase === 'during')}
					onToggle={toggleTodo}
					onDelete={deleteTodo}
					onAdd={addTodo}
				/>

				<TodoSection
					title="Before next step"
					description="Your definition of done—the gates that make the next loadout a clean transition."
					phase="before-next"
					todos={activeStep.todos.filter((todo) => todo.phase === 'before-next')}
					onToggle={toggleTodo}
					onDelete={deleteTodo}
					onAdd={addTodo}
				/>

				<BuildNotesSection
					sections={guide.notes}
					highlights={activeStep.noteHighlights ?? []}
					sourceUrl={guide.sourceUrl}
				/>

				<div class="flex items-center justify-between gap-3 pt-1">
					<Button
						type="button"
						color="dark"
						disabled={activeIndex <= 0}
						onclick={() => moveStep(-1)}
						class="!border-slate-700 !bg-slate-900"
					>
						<ArrowLeftOutline class="mr-2 size-4" /> Previous
					</Button>
					<Button
						type="button"
						color="cyan"
						disabled={activeIndex >= guide.steps.length - 1}
						onclick={() => moveStep(1)}
					>
						Next step <ArrowRightOutline class="ml-2 size-4" />
					</Button>
				</div>
			</div>

			<aside class="hidden xl:block">
				<div class="sticky top-6 space-y-4">
					<section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
						<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-slate-500 uppercase">
							Next build idea
						</p>
						<h2 class="mt-2 text-sm font-semibold text-slate-100">Hybrid Crit transition</h2>
						<p class="mt-2 text-xs leading-5 text-slate-500">
							Load the second PoB’s six checkpoints when you are ready to evaluate power-charge
							stacking.
						</p>
						<button
							type="button"
							onclick={() => selectGuide(sampleGuides[1])}
							class="mt-4 flex w-full items-center justify-between rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2.5 text-left text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/15"
						>
							Load transition <ArrowRightOutline class="size-3.5" />
						</button>
					</section>

					<section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
						<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-slate-500 uppercase">
							References
						</p>
						<div class="mt-3 space-y-2">
							<a
								href={PRIMARY_POB_URL}
								target="_blank"
								rel="noreferrer"
								class="flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-300"
							>
								<LinkOutline class="size-3.5" /> Primary PoB
							</a>
							<a
								href={TRANSITION_POB_URL}
								target="_blank"
								rel="noreferrer"
								class="flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-300"
							>
								<LinkOutline class="size-3.5" /> Transition PoB
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
	</main>

	<footer
		class="relative mt-8 border-t border-slate-900 px-4 py-8 text-center text-xs text-slate-700"
	>
		Atlas Step is an independent planning tool and is not affiliated with Grinding Gear Games.
	</footer>
</div>
