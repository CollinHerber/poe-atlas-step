<script lang="ts">
	import type { GuideStep } from '$lib/types/guide';

	let {
		steps,
		activeStepId,
		onSelect
	}: {
		steps: GuideStep[];
		activeStepId: string;
		onSelect: (id: string) => void;
	} = $props();

	const completion = (step: GuideStep) => {
		if (!step.todos.length) return 0;
		return Math.round((step.todos.filter((item) => item.done).length / step.todos.length) * 100);
	};
</script>

<nav aria-label="Build progression" class="overflow-x-auto lg:overflow-visible">
	<ol class="flex min-w-max gap-2 px-1 py-1 lg:block lg:min-w-0 lg:space-y-1 lg:px-0">
		{#each steps as step, index (step.id)}
			<li class="relative lg:pb-3">
				{#if index < steps.length - 1}
					<span
						class="absolute top-8 left-[1.875rem] hidden h-[calc(100%+0.25rem)] w-px bg-slate-700 lg:block"
						aria-hidden="true"
					></span>
				{/if}
				<button
					type="button"
					onclick={() => onSelect(step.id)}
					aria-current={activeStepId === step.id ? 'step' : undefined}
					class={`group flex w-64 items-start gap-3 rounded-xl border px-3 py-3 text-left transition lg:w-full ${
						activeStepId === step.id
							? 'border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.08)]'
							: 'border-transparent hover:border-slate-700 hover:bg-slate-800/60'
					}`}
				>
					<span
						class={`relative z-10 mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border text-xs font-bold ${
							completion(step) === 100
								? 'border-emerald-400 bg-emerald-400 text-slate-950'
								: activeStepId === step.id
									? 'border-cyan-300 bg-cyan-300 text-slate-950'
									: 'border-slate-600 bg-slate-900 text-slate-400'
						}`}
					>
						{completion(step) === 100 ? '✓' : index + 1}
					</span>
					<span class="min-w-0">
						<span
							class="block text-[0.65rem] font-semibold tracking-[0.18em] text-slate-500 uppercase"
						>
							{step.eyebrow}
						</span>
						<span class="mt-0.5 block truncate text-sm font-semibold text-slate-100"
							>{step.title}</span
						>
						<span class="mt-1 block text-xs text-slate-500">{completion(step)}% complete</span>
					</span>
				</button>
			</li>
		{/each}
	</ol>
</nav>
