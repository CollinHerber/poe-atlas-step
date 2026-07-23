<script lang="ts">
	import type { GuideStep } from '$lib/types/guide';

	let {
		step,
		accent
	}: {
		step: GuideStep;
		accent: 'cyan' | 'violet';
	} = $props();

	let stats = $derived(new Map((step.characterStats ?? []).map((stat) => [stat.name, stat.value])));
	let hasSnapshot = $derived(stats.size > 0);
	let dps = $derived(stats.get('FullDPS') ?? stats.get('CombinedDPS') ?? stats.get('TotalDPS'));
	let resistances = $derived(
		['FireResist', 'ColdResist', 'LightningResist', 'ChaosResist']
			.map((name) => formatPercent(stats.get(name)))
			.join(' / ')
	);

	const accentClasses = {
		cyan: {
			border: 'border-cyan-400/15',
			background: 'bg-cyan-400/5',
			label: 'text-cyan-400',
			badge: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
		},
		violet: {
			border: 'border-violet-400/15',
			background: 'bg-violet-400/5',
			label: 'text-violet-300',
			badge: 'border-violet-400/20 bg-violet-400/10 text-violet-300'
		}
	} as const;

	const wholeNumber = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 0
	});
	const decimalNumber = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	});

	function formatWhole(value: number | undefined) {
		return value === undefined ? '—' : wholeNumber.format(value);
	}

	function formatDecimal(value: number | undefined) {
		return value === undefined ? '—' : decimalNumber.format(value);
	}

	function formatPercent(value: number | undefined) {
		return value === undefined ? '—' : `${decimalNumber.format(value)}%`;
	}
</script>

{#if hasSnapshot}
	<div
		class={['mt-4 overflow-hidden rounded-xl border', accentClasses[accent].border]}
		aria-label={`Calculated Path of Building stats for ${step.title}`}
	>
		<div
			class={[
				'flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-3 py-2.5',
				accentClasses[accent].background
			]}
		>
			<p class="text-[0.65rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
				Headline PoB stats
			</p>
			<span
				class={[
					'rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold',
					accentClasses[accent].badge
				]}
			>
				Calculated snapshot
			</span>
		</div>

		<dl class="grid grid-cols-2 gap-px bg-slate-800/70 sm:grid-cols-4">
			{#each [{ label: 'Life', value: formatWhole(stats.get('Life')) }, { label: 'Energy shield', value: formatWhole(stats.get('EnergyShield')) }, { label: 'Mana', value: formatWhole(stats.get('Mana')) }, { label: 'eHP', value: formatWhole(stats.get('TotalEHP')) }] as stat (stat.label)}
				<div class="bg-slate-950/65 px-3 py-3">
					<dt
						class={[
							'text-[0.6rem] font-semibold tracking-wider uppercase',
							accentClasses[accent].label
						]}
					>
						{stat.label}
					</dt>
					<dd class="mt-1 text-sm font-bold text-slate-100">{stat.value}</dd>
				</div>
			{/each}
		</dl>

		<dl
			class="grid gap-px border-t border-slate-800/80 bg-slate-800/70 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_0.7fr_0.8fr]"
		>
			<div class="bg-slate-950/65 px-3 py-3">
				<dt
					class={[
						'text-[0.6rem] font-semibold tracking-wider uppercase',
						accentClasses[accent].label
					]}
				>
					Resistances
				</dt>
				<dd class="mt-1 text-sm font-bold whitespace-nowrap text-slate-100">{resistances}</dd>
				<p class="mt-0.5 text-[0.6rem] text-slate-700">Fire / Cold / Lightning / Chaos</p>
			</div>
			<div class="bg-slate-950/65 px-3 py-3">
				<dt
					class={[
						'text-[0.6rem] font-semibold tracking-wider uppercase',
						accentClasses[accent].label
					]}
				>
					DPS
				</dt>
				<dd class="mt-1 text-sm font-bold text-slate-100">{formatWhole(dps)}</dd>
			</div>
			<div class="bg-slate-950/65 px-3 py-3">
				<dt
					class={[
						'text-[0.6rem] font-semibold tracking-wider uppercase',
						accentClasses[accent].label
					]}
				>
					Speed
				</dt>
				<dd class="mt-1 text-sm font-bold text-slate-100">{formatDecimal(stats.get('Speed'))}</dd>
			</div>
			<div class="bg-slate-950/65 px-3 py-3">
				<dt
					class={[
						'text-[0.6rem] font-semibold tracking-wider uppercase',
						accentClasses[accent].label
					]}
				>
					Hit chance
				</dt>
				<dd class="mt-1 text-sm font-bold text-slate-100">
					{formatPercent(stats.get('HitChance'))}
				</dd>
			</div>
		</dl>
	</div>
{:else}
	<div class="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/35 px-4 py-3">
		<p class="text-xs font-semibold text-slate-500">Calculated stat snapshot unavailable</p>
		<p class="mt-1 text-[0.65rem] leading-5 text-slate-700">
			PoB exports these headline values only for the loadout that was active when the build was
			saved.
		</p>
	</div>
{/if}
