<script lang="ts">
	import type { Weapon } from '$lib/types';
	import { fetchWeaponUpgrades, type UpgradeRow } from '$lib/api/items';
	import {
		computeAR,
		pickUpgradeRow,
		maxUpgradeLevel,
		DAMAGE_LABEL,
		DAMAGE_COLOR,
		type CharStats,
		type DamageType,
		type AR
	} from '$lib/ar/ar';

	interface Props {
		weapon: Weapon | null;
		onclose: () => void;
	}
	let { weapon, onclose }: Props = $props();

	const DEFAULT_STATS: CharStats = {
		strength: 60,
		dexterity: 60,
		intelligence: 60,
		faith: 60,
		arcane: 60
	};

	let stats = $state<CharStats>({ ...DEFAULT_STATS });
	let rows = $state<UpgradeRow[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let level = $state(0);

	$effect(() => {
		if (!weapon?.id) {
			rows = [];
			return;
		}
		let cancelled = false;
		loading = true;
		rows = [];
		error = null;
		fetchWeaponUpgrades(weapon.id)
			.then((r) => {
				if (cancelled) return;
				rows = r;
				level = maxUpgradeLevel(r);
				loading = false;
			})
			.catch((e) => {
				if (cancelled) return;
				error = e instanceof Error ? e.message : 'Failed to load upgrades';
				loading = false;
			});
		return () => {
			cancelled = true;
		};
	});

	const maxLevel = $derived(maxUpgradeLevel(rows));
	const currentRow = $derived(pickUpgradeRow(rows, level));
	const currentAR = $derived(
		weapon && currentRow ? computeAR(weapon.name, currentRow, stats) : null
	);

	const arByLevel = $derived.by(() => {
		if (!weapon || !rows.length) return [] as { level: number; ar: AR }[];
		const out: { level: number; ar: AR }[] = [];
		for (let L = 0; L <= maxLevel; L++) {
			const row = pickUpgradeRow(rows, L);
			if (!row) continue;
			out.push({ level: L, ar: computeAR(weapon.name, row, stats) });
		}
		return out;
	});

	function fmt(n: number | undefined) {
		return n == null ? '—' : Math.floor(n).toString();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function stopClick(e: MouseEvent) {
		e.stopPropagation();
	}

	// Chart geometry
	const CHART_W = 360;
	const CHART_H = 130;
	const PAD = { top: 8, right: 12, bottom: 20, left: 30 };
	const innerW = CHART_W - PAD.left - PAD.right;
	const innerH = CHART_H - PAD.top - PAD.bottom;

	const chartMaxAR = $derived(
		arByLevel.length ? Math.max(1, ...arByLevel.map((p) => p.ar.total)) : 1
	);

	function pointX(L: number) {
		if (maxLevel <= 0) return PAD.left;
		return PAD.left + (L / maxLevel) * innerW;
	}
	function pointY(v: number) {
		return PAD.top + innerH - (v / chartMaxAR) * innerH;
	}

	const linePath = $derived.by(() => {
		if (!arByLevel.length) return '';
		return arByLevel
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pointX(p.level)} ${pointY(p.ar.total)}`)
			.join(' ');
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if weapon}
	<div
		class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
		onclick={onclose}
		onkeydown={handleKeydown}
		role="button"
		tabindex="-1"
	>
		<div
			class="bg-dark-800 border border-gold/40 rounded-xl shadow-2xl shadow-black/50
				w-full max-w-2xl max-h-[92vh] overflow-y-auto"
			onclick={stopClick}
			role="dialog"
			aria-modal="true"
			aria-label={weapon.name}
		>
			<!-- Header -->
			<div class="flex items-start justify-between gap-3 p-5 border-b border-gold/20">
				<div class="flex items-start gap-4 min-w-0">
					{#if weapon.image}
						<img
							src={weapon.image}
							alt={weapon.name}
							class="w-16 h-16 object-contain bg-dark-900 rounded shrink-0"
							onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
						/>
					{/if}
					<div class="min-w-0">
						<h2 class="font-cinzel text-gold text-xl tracking-wider truncate">{weapon.name}</h2>
						{#if weapon.category}
							<p class="text-parchment/60 text-xs mt-0.5 font-cinzel tracking-wider">
								{weapon.category}
							</p>
						{/if}
						{#if weapon.weight != null}
							<p class="text-parchment/40 text-[10px] mt-0.5 font-cinzel">Weight {weapon.weight}</p>
						{/if}
					</div>
				</div>
				<button
					type="button"
					onclick={onclose}
					aria-label="Close"
					class="text-parchment/50 hover:text-parchment text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-dark-700"
				>×</button>
			</div>

			<!-- Body -->
			<div class="p-5 space-y-5">
				{#if weapon.description}
					<p class="text-parchment/70 text-xs italic border-l-2 border-gold/40 pl-3 whitespace-pre-line">
						{weapon.description}
					</p>
				{/if}

				<!-- Requirements + Scaling -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#if weapon.requiredAttributes?.length}
						<section>
							<p class="text-[10px] font-cinzel uppercase tracking-widest text-gold/70 mb-1.5 border-b border-gold/25 pb-1">Requirements</p>
							<ul class="text-xs text-parchment/80 space-y-0.5">
								{#each weapon.requiredAttributes as r}
									<li class="flex justify-between">
										<span>{r.name}</span>
										<span class="text-gold">{r.amount}</span>
									</li>
								{/each}
							</ul>
						</section>
					{/if}
					{#if weapon.scalesWith?.length}
						<section>
							<p class="text-[10px] font-cinzel uppercase tracking-widest text-gold/70 mb-1.5 border-b border-gold/25 pb-1">Scaling</p>
							<ul class="text-xs text-parchment/80 space-y-0.5">
								{#each weapon.scalesWith as s}
									{#if s.scaling && !['-', '0'].includes(String(s.scaling).trim())}
										<li class="flex justify-between">
											<span>{s.name}</span>
											<span class="text-gold">{s.scaling}</span>
										</li>
									{/if}
								{/each}
							</ul>
						</section>
					{/if}
				</div>

				<!-- Stats sliders -->
				<section>
					<p class="text-[10px] font-cinzel uppercase tracking-widest text-gold/70 mb-2 border-b border-gold/25 pb-1">Character stats</p>
					<div class="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
						{#each [{ key: 'strength', label: 'Str' }, { key: 'dexterity', label: 'Dex' }, { key: 'intelligence', label: 'Int' }, { key: 'faith', label: 'Fai' }, { key: 'arcane', label: 'Arc' }] as row}
							<label class="flex flex-col gap-0.5">
								<span class="flex items-center justify-between">
									<span class="text-parchment/60 font-cinzel">{row.label}</span>
									<span class="text-gold font-cinzel">{stats[row.key as keyof CharStats]}</span>
								</span>
								<input
									type="range"
									min="1"
									max="99"
									bind:value={stats[row.key as keyof CharStats]}
									class="accent-gold"
								/>
							</label>
						{/each}
					</div>
				</section>

				<!-- AR block -->
				{#if loading}
					<p class="text-parchment/40 text-xs italic text-center py-4">Loading upgrade data…</p>
				{:else if error}
					<p class="text-red-400 text-xs">{error}</p>
				{:else if !currentAR}
					<p class="text-parchment/40 text-xs italic text-center py-4">No upgrade data</p>
				{:else}
					<section>
						<div class="flex items-center justify-between mb-2 border-b border-gold/25 pb-1">
							<p class="text-[10px] font-cinzel uppercase tracking-widest text-gold/70">Attack power at +{level}</p>
							<div class="relative">
								<select
									bind:value={level}
									style="appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:none;"
									class="bg-dark-900 border border-dark-400 rounded text-xs text-parchment/80 pl-2 pr-6 py-0.5 font-cinzel cursor-pointer focus:outline-none focus:border-gold/50"
								>
									{#each Array.from({ length: maxLevel + 1 }, (_, i) => i) as L}
										<option value={L}>+{L}</option>
									{/each}
								</select>
								<svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gold/70 pointer-events-none" viewBox="0 0 12 12" fill="currentColor">
									<path d="M6 8L1 3h10z" />
								</svg>
							</div>
						</div>
						<div class="space-y-1.5">
							{#each (['phy', 'mag', 'fir', 'lit', 'hol'] as DamageType[]) as t}
								{#if currentAR[t] > 0}
									<div class="flex items-center gap-2 text-xs">
										<span class="w-8 text-parchment/60 font-cinzel text-[10px]">{DAMAGE_LABEL[t]}</span>
										<div class="flex-1 h-3 bg-dark-900 rounded overflow-hidden">
											<div
												class="h-full transition-all duration-300"
												style="width: {(currentAR[t] / chartMaxAR) * 100}%; background: {DAMAGE_COLOR[t]}"
											></div>
										</div>
										<span class="w-10 text-right text-parchment font-cinzel">{fmt(currentAR[t])}</span>
									</div>
								{/if}
							{/each}
						</div>
						<div class="flex justify-between items-baseline pt-2 mt-2 border-t border-gold/20">
							<span class="text-gold/70 font-cinzel text-xs">AR Total</span>
							<span class="text-gold font-cinzel text-2xl">{currentAR.total}</span>
						</div>
					</section>

					<!-- Chart : AR by upgrade level -->
					{#if arByLevel.length > 1}
						<section>
							<p class="text-[10px] font-cinzel uppercase tracking-widest text-gold/70 mb-2 border-b border-gold/25 pb-1">
								Total AR by upgrade level
							</p>
							<div class="flex justify-center bg-dark-900/60 rounded p-2 overflow-x-auto">
								<svg viewBox="0 0 {CHART_W} {CHART_H}" class="w-full max-w-md">
									<!-- Grid lines -->
									{#each [0, 0.25, 0.5, 0.75, 1] as ratio}
										<line
											x1={PAD.left}
											x2={CHART_W - PAD.right}
											y1={PAD.top + innerH * (1 - ratio)}
											y2={PAD.top + innerH * (1 - ratio)}
											stroke="rgba(241, 222, 193, 0.08)"
											stroke-width="0.5"
										/>
										<text
											x={PAD.left - 4}
											y={PAD.top + innerH * (1 - ratio) + 3}
											text-anchor="end"
											class="fill-parchment/40"
											font-size="8"
											font-family="Cinzel"
										>{Math.floor(chartMaxAR * ratio)}</text>
									{/each}
									<!-- X axis labels -->
									{#each arByLevel.filter((_, i) => i % Math.max(1, Math.ceil(arByLevel.length / 6)) === 0) as p}
										<text
											x={pointX(p.level)}
											y={CHART_H - 6}
											text-anchor="middle"
											class="fill-parchment/40"
											font-size="8"
											font-family="Cinzel"
										>+{p.level}</text>
									{/each}
									<!-- Line -->
									<path d={linePath} fill="none" stroke="#d4af37" stroke-width="1.5" />
									<!-- Points -->
									{#each arByLevel as p}
										<circle
											cx={pointX(p.level)}
											cy={pointY(p.ar.total)}
											r={p.level === level ? 3 : 1.5}
											class={p.level === level ? 'fill-gold' : 'fill-gold/60'}
										/>
									{/each}
								</svg>
							</div>
						</section>
					{/if}
				{/if}

				<!-- Footer link -->
				<div class="pt-2 border-t border-gold/20 flex items-center justify-end">
					<a
						href={`/?item=${encodeURIComponent(weapon.id)}`}
						class="text-xs font-cinzel tracking-wider text-gold/60 hover:text-gold transition-colors"
					>
						See builds using this weapon →
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}
