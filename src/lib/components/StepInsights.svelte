<script lang="ts">
	import { tick } from 'svelte';
	import {
		CheckOutline,
		CloseOutline,
		EditOutline,
		PlusOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import type { GuideInsight } from '$lib/types/guide';

	let {
		insights,
		onAdd,
		onEdit,
		onDelete
	}: {
		insights: GuideInsight[];
		onAdd: (insight: GuideInsight) => void;
		onEdit: (index: number, insight: GuideInsight) => void;
		onDelete: (index: number) => void;
	} = $props();

	let editorMode = $state<'add' | 'edit' | null>(null);
	let editingIndex = $state<number | null>(null);
	let titleInput = $state<HTMLInputElement>();
	let draft = $state<GuideInsight>({
		title: '',
		body: '',
		sourceLabel: '',
		sourceUrl: ''
	});

	async function openAddEditor() {
		editorMode = 'add';
		editingIndex = null;
		draft = {
			title: '',
			body: '',
			sourceLabel: 'Reference',
			sourceUrl: ''
		};
		await tick();
		titleInput?.focus();
	}

	async function openEditEditor(index: number, insight: GuideInsight) {
		editorMode = 'edit';
		editingIndex = index;
		draft = { ...insight };
		await tick();
		titleInput?.focus();
	}

	function closeEditor() {
		editorMode = null;
		editingIndex = null;
	}

	function saveReference(event: SubmitEvent) {
		event.preventDefault();
		const insight = {
			title: draft.title.trim(),
			body: draft.body.trim(),
			sourceLabel: draft.sourceLabel.trim(),
			sourceUrl: draft.sourceUrl.trim()
		};
		if (!insight.title || !insight.body || !insight.sourceLabel || !insight.sourceUrl) return;

		if (editorMode === 'edit' && editingIndex !== null) {
			onEdit(editingIndex, insight);
		} else {
			onAdd(insight);
		}
		closeEditor();
	}
</script>

<section
	class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 shadow-xl shadow-black/10"
>
	<header
		class="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6"
	>
		<div>
			<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-amber-300/80 uppercase">
				References
			</p>
			<h3 class="mt-1 text-base font-semibold text-slate-100">What to know at this step</h3>
			<p class="mt-1 text-sm leading-6 text-slate-500">
				Keep the mechanics, trade-offs, and useful source links beside the checklist.
			</p>
		</div>
		<button
			type="button"
			onclick={openAddEditor}
			class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/20 bg-amber-300/8 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:border-amber-300/40 hover:bg-amber-300/12"
		>
			<PlusOutline class="size-3.5" />
			<span class="hidden sm:inline">Add reference</span>
			<span class="sm:hidden">Add</span>
		</button>
	</header>

	{#if editorMode}
		<form
			onsubmit={saveReference}
			class="border-b border-slate-800 bg-slate-950/35 px-5 py-5 sm:px-6"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
					Reference title
					<input
						bind:this={titleInput}
						bind:value={draft.title}
						required
						maxlength="300"
						placeholder="Why this source matters"
						class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
					/>
				</label>
				<label class="grid gap-1.5 text-xs font-semibold text-slate-400">
					Link label
					<input
						bind:value={draft.sourceLabel}
						required
						maxlength="300"
						placeholder="Source PoB, video, wiki…"
						class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
					/>
				</label>
				<label class="grid gap-1.5 text-xs font-semibold text-slate-400 sm:col-span-2">
					URL
					<input
						type="url"
						bind:value={draft.sourceUrl}
						required
						maxlength="1000"
						pattern="https?://.+"
						title="Enter a full http:// or https:// URL"
						placeholder="https://…"
						class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
					/>
				</label>
				<label class="grid gap-1.5 text-xs font-semibold text-slate-400 sm:col-span-2">
					Notes
					<textarea
						bind:value={draft.body}
						required
						maxlength="4000"
						rows="3"
						placeholder="What should you remember from this reference?"
						class="resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm leading-6 font-normal text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
					></textarea>
				</label>
			</div>
			<div class="mt-4 flex flex-wrap justify-end gap-2">
				<button
					type="button"
					onclick={closeEditor}
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
				>
					<CloseOutline class="size-3.5" /> Cancel
				</button>
				<button
					type="submit"
					class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
				>
					<CheckOutline class="size-3.5" />
					{editorMode === 'edit' ? 'Save changes' : 'Add reference'}
				</button>
			</div>
		</form>
	{/if}

	<div class="grid gap-px bg-slate-800/80 md:grid-cols-2">
		{#each insights as insight, index (`${insight.sourceUrl}-${index}`)}
			<article class="group bg-slate-900/95 px-5 py-5 sm:px-6">
				<div class="flex items-start justify-between gap-3">
					<h4 class="text-sm font-semibold text-slate-100">{insight.title}</h4>
					<div
						class="flex shrink-0 items-center opacity-70 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
					>
						<button
							type="button"
							onclick={() => openEditEditor(index, insight)}
							class="rounded-lg p-1.5 text-slate-600 transition hover:bg-cyan-400/10 hover:text-cyan-300"
							aria-label={`Edit reference “${insight.title}”`}
						>
							<EditOutline class="size-4" />
						</button>
						<button
							type="button"
							onclick={() => onDelete(index)}
							class="rounded-lg p-1.5 text-slate-700 transition hover:bg-rose-400/10 hover:text-rose-300"
							aria-label={`Delete reference “${insight.title}”`}
						>
							<TrashBinOutline class="size-4" />
						</button>
					</div>
				</div>
				<p class="mt-2 text-sm leading-6 text-slate-400">{insight.body}</p>
				<!-- These are researched external references, not internal SvelteKit routes. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href={insight.sourceUrl}
					target="_blank"
					rel="noreferrer"
					class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
				>
					{insight.sourceLabel} <span aria-hidden="true">↗</span>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</article>
		{:else}
			<p class="bg-slate-900/95 px-6 py-8 text-center text-sm text-slate-600 md:col-span-2">
				No references yet. Add a source or a note that will help at this checkpoint.
			</p>
		{/each}
	</div>
</section>
