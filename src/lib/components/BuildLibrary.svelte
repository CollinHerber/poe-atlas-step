<script lang="ts">
	import {
		BookmarkOutline,
		FileCopyOutline,
		FolderOpenOutline,
		ShareNodesOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import type { SavedBuildRecord } from '$lib/persistence/build-library';

	let {
		builds,
		activeBuildId,
		buildName = $bindable(),
		shareUrl,
		message,
		sharing,
		onSave,
		onLoad,
		onDelete,
		onShare,
		onCopy
	}: {
		builds: SavedBuildRecord[];
		activeBuildId: string | null;
		buildName: string;
		shareUrl: string;
		message: string;
		sharing: boolean;
		onSave: (name: string) => void;
		onLoad: (build: SavedBuildRecord) => void;
		onDelete: (build: SavedBuildRecord) => void;
		onShare: () => void;
		onCopy: () => void;
	} = $props();

	const completion = (build: SavedBuildRecord) => {
		const todos = build.guide.steps.flatMap((step) => step.todos);
		return todos.length
			? Math.round((todos.filter((todo) => todo.done).length / todos.length) * 100)
			: 0;
	};

	const formatUpdatedAt = (value: string) =>
		new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(value));
</script>

<section
	class="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/10"
>
	<div
		class="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
	>
		<div class="flex items-start gap-3">
			<div
				class="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300"
			>
				<BookmarkOutline class="size-5" />
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
					Build library
				</p>
				<h2 class="mt-1 text-base font-semibold text-white">Save locally or share this plan</h2>
				<p class="mt-1 text-xs leading-5 text-slate-500">
					Saved builds stay on this device. Share links contain a portable copy of the current
					build.
				</p>
			</div>
		</div>
		<span
			class="self-start rounded-full border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-semibold text-slate-500"
		>
			{builds.length} saved
		</span>
	</div>

	<div class="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
		<form
			onsubmit={(event) => {
				event.preventDefault();
				onSave(buildName);
			}}
			class="rounded-xl border border-slate-800 bg-slate-950/35 p-4"
		>
			<label for="saved-build-name" class="text-xs font-semibold text-slate-300">
				Save current build as
			</label>
			<div class="mt-2 flex gap-2">
				<input
					id="saved-build-name"
					bind:value={buildName}
					maxlength="200"
					class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
					placeholder="My Winter Orb mapper"
				/>
				<button
					type="submit"
					class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
				>
					<BookmarkOutline class="size-4" /> Save copy
				</button>
			</div>
			<p class="mt-2 text-xs text-slate-600">
				Once loaded, changes to a saved build are automatically kept up to date.
			</p>
		</form>

		<div class="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
			<p class="text-xs font-semibold text-slate-300">Share current build</p>
			<div class="mt-2 flex gap-2">
				<button
					type="button"
					disabled={sharing}
					onclick={onShare}
					class="inline-flex shrink-0 items-center gap-2 rounded-lg border border-violet-400/35 bg-violet-400/10 px-3.5 py-2.5 text-xs font-bold text-violet-300 transition hover:bg-violet-400/15 disabled:cursor-wait disabled:opacity-60"
				>
					<ShareNodesOutline class="size-4" />
					{sharing ? 'Generating…' : 'Generate link'}
				</button>
				{#if shareUrl}
					<input
						aria-label="Generated build share link"
						value={shareUrl}
						readonly
						onfocus={(event) => event.currentTarget.select()}
						class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 focus:border-violet-400 focus:outline-none"
					/>
					<button
						type="button"
						onclick={onCopy}
						aria-label="Copy build share link"
						class="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-violet-400/50 hover:text-violet-300"
					>
						<FileCopyOutline class="size-4" />
					</button>
				{/if}
			</div>
			<p class="mt-2 text-xs text-slate-600">
				The recipient does not need an account or your browser storage.
			</p>
		</div>
	</div>

	{#if message}
		<p class="border-t border-slate-800 px-5 py-3 text-xs text-cyan-300 sm:px-6" role="status">
			{message}
		</p>
	{/if}

	{#if builds.length}
		<div class="border-t border-slate-800 p-5 sm:px-6">
			<div class="grid gap-2 lg:grid-cols-2">
				{#each builds as build (build.id)}
					<article
						class={`flex items-center gap-3 rounded-xl border p-3 ${
							build.id === activeBuildId
								? 'border-cyan-400/35 bg-cyan-400/[0.07]'
								: 'border-slate-800 bg-slate-950/25'
						}`}
					>
						<div class="min-w-0 flex-1">
							<div class="flex min-w-0 items-center gap-2">
								<h3 class="truncate text-sm font-semibold text-slate-200">{build.name}</h3>
								{#if build.id === activeBuildId}
									<span class="shrink-0 text-[0.6rem] font-semibold text-cyan-400 uppercase"
										>Open</span
									>
								{/if}
							</div>
							<p class="mt-1 truncate text-xs text-slate-600">
								{build.guide.name} · {completion(build)}% · Updated {formatUpdatedAt(
									build.updatedAt
								)}
							</p>
						</div>
						<button
							type="button"
							onclick={() => onLoad(build)}
							aria-label={`Load ${build.name}`}
							class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
						>
							<FolderOpenOutline class="size-4" />
						</button>
						<button
							type="button"
							onclick={() => onDelete(build)}
							aria-label={`Delete ${build.name}`}
							class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-800 text-slate-600 transition hover:border-rose-400/50 hover:text-rose-300"
						>
							<TrashBinOutline class="size-4" />
						</button>
					</article>
				{/each}
			</div>
		</div>
	{/if}
</section>
