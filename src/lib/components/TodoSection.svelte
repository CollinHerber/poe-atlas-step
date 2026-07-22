<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import type { GuideTodo, TodoPhase } from '$lib/types/guide';

	let {
		title,
		description,
		phase,
		todos,
		onToggle,
		onDelete,
		onAdd
	}: {
		title: string;
		description: string;
		phase: TodoPhase;
		todos: GuideTodo[];
		onToggle: (id: string) => void;
		onDelete: (id: string) => void;
		onAdd: (text: string, phase: TodoPhase) => void;
	} = $props();

	let draft = $state('');

	function addTodo(event: SubmitEvent) {
		event.preventDefault();
		const text = draft.trim();
		if (!text) return;
		onAdd(text, phase);
		draft = '';
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
				{todos.filter((todo) => todo.done).length}/{todos.length}
			</span>
		</div>
	</header>

	<div class="divide-y divide-slate-800/80">
		{#each todos as todo (todo.id)}
			<div class="group flex items-start gap-3 px-5 py-4 sm:px-6">
				<input
					type="checkbox"
					checked={todo.done}
					onchange={() => onToggle(todo.id)}
					class="mt-0.5 size-5 rounded border-slate-600 bg-slate-950 text-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
					aria-label={`Mark “${todo.text}” as ${todo.done ? 'incomplete' : 'complete'}`}
				/>
				<span
					class={`min-w-0 flex-1 text-sm leading-6 ${todo.done ? 'text-slate-600 line-through' : 'text-slate-300'}`}
				>
					{todo.text}
				</span>
				<button
					type="button"
					onclick={() => onDelete(todo.id)}
					class="rounded-lg p-1.5 text-slate-700 opacity-0 transition group-hover:opacity-100 hover:bg-rose-400/10 hover:text-rose-300 focus:opacity-100"
					aria-label={`Delete “${todo.text}”`}
				>
					<TrashBinOutline class="size-4" />
				</button>
			</div>
		{:else}
			<p class="px-6 py-8 text-center text-sm text-slate-600">
				No goals yet. Add the first one below.
			</p>
		{/each}
	</div>

	<form onsubmit={addTodo} class="flex gap-2 border-t border-slate-800 bg-slate-950/25 p-4 sm:px-5">
		<label class="sr-only" for={`todo-${phase}`}>Add a {title.toLowerCase()} goal</label>
		<input
			id={`todo-${phase}`}
			bind:value={draft}
			placeholder="Add your own checkpoint…"
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
