<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import {
		CheckOutline,
		CloseOutline,
		EditOutline,
		PlusOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import type { GuideTodo, TodoPhase } from '$lib/types/guide';

	let {
		title,
		description,
		phase,
		items,
		onToggle,
		onDelete,
		onEdit,
		onAdd
	}: {
		title: string;
		description: string;
		phase: TodoPhase;
		items: GuideTodo[];
		onToggle: (id: string) => void;
		onDelete: (id: string) => void;
		onEdit: (id: string, text: string) => void;
		onAdd: (text: string, phase: TodoPhase) => void;
	} = $props();

	let draft = $state('');
	let editingId = $state<string | null>(null);
	let editDraft = $state('');
	let editInput = $state<HTMLInputElement>();

	function addChecklistItem(event: SubmitEvent) {
		event.preventDefault();
		const text = draft.trim();
		if (!text) return;
		onAdd(text, phase);
		draft = '';
	}

	async function startEditing(item: GuideTodo) {
		editingId = item.id;
		editDraft = item.text;
		await tick();
		editInput?.focus();
	}

	function cancelEditing() {
		editingId = null;
		editDraft = '';
	}

	function saveChecklistItem(event: SubmitEvent, id: string) {
		event.preventDefault();
		const text = editDraft.trim();
		if (!text) return;
		onEdit(id, text);
		cancelEditing();
	}
</script>

<section class="rounded-2xl border border-slate-800 bg-slate-900/65 shadow-xl shadow-black/10">
	<header class="border-b border-slate-800 px-5 py-4 sm:px-6">
		<div class="flex items-start justify-between gap-4">
			<div>
				<h3 class="text-base font-semibold text-slate-100">{title}</h3>
				<p class="mt-1 text-sm leading-6 text-slate-500">{description}</p>
			</div>
			<span class="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
				{items.filter((item) => item.done).length}/{items.length}
			</span>
		</div>
	</header>

	<div class="divide-y divide-slate-800/80">
		{#each items as item (item.id)}
			<div class="group flex items-start gap-3 px-5 py-4 sm:px-6">
				<input
					type="checkbox"
					checked={item.done}
					onchange={() => onToggle(item.id)}
					class="mt-0.5 size-5 rounded border-slate-600 bg-slate-950 text-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
					aria-label={`Mark “${item.text}” as ${item.done ? 'incomplete' : 'complete'}`}
				/>
				{#if editingId === item.id}
					<form
						onsubmit={(event) => saveChecklistItem(event, item.id)}
						class="flex min-w-0 flex-1 items-start gap-2"
					>
						<label class="sr-only" for={`edit-todo-${item.id}`}>Edit checklist item</label>
						<input
							id={`edit-todo-${item.id}`}
							bind:this={editInput}
							bind:value={editDraft}
							required
							maxlength="2000"
							class="min-w-0 flex-1 rounded-lg border border-cyan-400/50 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 focus:outline-none"
						/>
						<button
							type="submit"
							class="rounded-lg bg-cyan-400/10 p-2 text-cyan-300 transition hover:bg-cyan-400/20 hover:text-cyan-200"
							aria-label="Save checklist item"
						>
							<CheckOutline class="size-4" />
						</button>
						<button
							type="button"
							onclick={cancelEditing}
							class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
							aria-label="Cancel editing checklist item"
						>
							<CloseOutline class="size-4" />
						</button>
					</form>
				{:else}
					<span
						class={`min-w-0 flex-1 text-sm leading-6 ${item.done ? 'text-slate-600 line-through' : 'text-slate-300'}`}
					>
						{item.text}
					</span>
					<div
						class="flex shrink-0 items-center opacity-70 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
					>
						<button
							type="button"
							onclick={() => startEditing(item)}
							class="rounded-lg p-1.5 text-slate-600 transition hover:bg-cyan-400/10 hover:text-cyan-300"
							aria-label={`Edit “${item.text}”`}
						>
							<EditOutline class="size-4" />
						</button>
						<button
							type="button"
							onclick={() => onDelete(item.id)}
							class="rounded-lg p-1.5 text-slate-700 transition hover:bg-rose-400/10 hover:text-rose-300"
							aria-label={`Delete “${item.text}”`}
						>
							<TrashBinOutline class="size-4" />
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<p class="px-6 py-8 text-center text-sm text-slate-600">
				No checklist items yet. Add the first action below.
			</p>
		{/each}
	</div>

	<form
		onsubmit={addChecklistItem}
		class="flex gap-2 border-t border-slate-800 bg-slate-950/25 p-4 sm:px-5"
	>
		<label class="sr-only" for={`checklist-${phase}`}>Add a checklist item to {title}</label>
		<input
			id={`checklist-${phase}`}
			bind:value={draft}
			maxlength="2000"
			placeholder="Add a checklist action…"
			class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
		/>
		<Button
			type="submit"
			size="sm"
			color="dark"
			class="!border-slate-700 !bg-slate-800 hover:!bg-slate-700"
		>
			<PlusOutline class="size-4 sm:mr-1" />
			<span class="hidden sm:inline">Add</span>
		</Button>
	</form>
</section>
