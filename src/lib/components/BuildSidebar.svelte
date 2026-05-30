<script lang="ts">
	import type { BuildState, CharacterStats } from '$lib/types';
	import AttackPowerPanel from './AttackPowerPanel.svelte';
	import RadarChart from './charts/RadarChart.svelte';
	import BarList from './charts/BarList.svelte';
	import {
		SOFT_CAPS,
		softCapStatus,
		maxEquipLoad,
		rollCategory,
		ROLL_COLOR,
		memorySlotsFromMind,
		characterLevel,
		normalizeStatKey
	} from '$lib/ar/mechanics';

	interface Props {
		build: BuildState;
	}

	let { build }: Props = $props();

	const STATS_ORDER = ['vigor', 'mind', 'endurance', 'strength', 'dexterity', 'intelligence', 'faith', 'arcane'] as const;
	const STAT_LABEL: Record<(typeof STATS_ORDER)[number], string> = {
		vigor: 'Vig', mind: 'Mnd', endurance: 'End', strength: 'Str',
		dexterity: 'Dex', intelligence: 'Int', faith: 'Fai', arcane: 'Arc'
	};

	// ── Niveau + soft caps ──
	const level = $derived(characterLevel(build.stats));
	const statWarnings = $derived(
		STATS_ORDER.map((s) => ({ stat: s, value: build.stats[s], status: softCapStatus(s, build.stats[s]) }))
			.filter((x) => x.status.level > 0)
	);

	// ── Equip Load ──
	const totalWeight = $derived(
		(build.armor.head?.weight ?? 0) +
			(build.armor.chest?.weight ?? 0) +
			(build.armor.hands?.weight ?? 0) +
			(build.armor.legs?.weight ?? 0) +
			(build.weapons.right?.weight ?? 0) +
			(build.weapons.left?.weight ?? 0)
	);
	const maxLoad = $derived(maxEquipLoad(build.stats.endurance));
	const loadRatio = $derived(totalWeight / maxLoad);
	const roll = $derived(rollCategory(loadRatio));

	// ── Memory slots ──
	const slotsAvail = $derived(memorySlotsFromMind(build.stats.mind));
	const slotsUsed = $derived(build.spells.reduce((s, sp) => s + (sp ? sp.slots ?? 1 : 0), 0));

	// ── Requirements check ──
	interface ReqCheckItem {
		label: string;
		category: 'Weapon' | 'Spell';
		image?: string;
		reqs: { stat: keyof CharacterStats; need: number; have: number; ok: boolean }[];
	}
	const reqItems = $derived.by<ReqCheckItem[]>(() => {
		const out: ReqCheckItem[] = [];
		const push = (label: string, cat: 'Weapon' | 'Spell', image: string | undefined, raw: { name: string; amount: number | string }[] | undefined) => {
			if (!Array.isArray(raw) || raw.length === 0) return;
			const reqs = raw
				.map((r) => {
					const k = normalizeStatKey(r.name);
					if (!k) return null;
					const need = Number(r.amount) || 0;
					if (need <= 0) return null;
					const have = build.stats[k];
					return { stat: k, need, have, ok: have >= need };
				})
				.filter((x): x is NonNullable<typeof x> => x !== null);
			if (reqs.length) out.push({ label, category: cat, image, reqs });
		};
		if (build.weapons.right) push(build.weapons.right.name, 'Weapon', build.weapons.right.image, (build.weapons.right as { requiredAttributes?: { name: string; amount: number }[] }).requiredAttributes);
		if (build.weapons.left) push(build.weapons.left.name, 'Weapon', build.weapons.left.image, (build.weapons.left as { requiredAttributes?: { name: string; amount: number }[] }).requiredAttributes);
		for (const sp of build.spells) {
			if (sp) push(sp.name, 'Spell', sp.image, (sp as { requires?: { name: string; amount: number }[] }).requires);
		}
		return out;
	});
	const reqHasFail = $derived(reqItems.some((i) => i.reqs.some((r) => !r.ok)));

	// ── Defense / Resistances ──
	const negCats = ['Phy', 'Strike', 'Slash', 'Pierce', 'Magic', 'Fire', 'Ligt', 'Holy'] as const;
	const resCats = ['Immunity', 'Robustness', 'Focus', 'Vitality', 'Poise'] as const;
	const negValues = $derived.by(() => {
		const sums: Record<string, number> = Object.fromEntries(negCats.map((c) => [c, 0]));
		for (const piece of [build.armor.head, build.armor.chest, build.armor.hands, build.armor.legs]) {
			if (!piece) continue;
			const arr = (piece as { dmgNegation?: { name: string; amount: number | string }[] }).dmgNegation;
			if (!Array.isArray(arr)) continue;
			for (const e of arr) if (sums[e.name] !== undefined) sums[e.name] += Number(e.amount) || 0;
		}
		return negCats.map((c) => Math.round(sums[c] * 10) / 10);
	});
	const resValues = $derived.by(() => {
		const sums: Record<string, number> = Object.fromEntries(resCats.map((c) => [c, 0]));
		for (const piece of [build.armor.head, build.armor.chest, build.armor.hands, build.armor.legs]) {
			if (!piece) continue;
			const arr = (piece as { resistance?: { name: string; amount: number | string }[] }).resistance;
			if (!Array.isArray(arr)) continue;
			for (const e of arr) if (sums[e.name] !== undefined) sums[e.name] += Number(e.amount) || 0;
		}
		return resCats.map((c) => sums[c]);
	});
	const hasArmor = $derived(!!(build.armor.head || build.armor.chest || build.armor.hands || build.armor.legs));

	// ── Effets cumulés (talismans + armures special effects) ──
	interface Effect {
		source: string;
		text: string;
		image?: string;
	}
	const effects = $derived.by<Effect[]>(() => {
		const out: Effect[] = [];
		for (const t of build.talismans) {
			if (t?.effect) out.push({ source: t.name, text: t.effect, image: t.image });
		}
		const armorPieces = [build.armor.head, build.armor.chest, build.armor.hands, build.armor.legs];
		for (const a of armorPieces) {
			const special = (a as { special_effect?: string; 'special effect'?: string } | null)?.['special effect'] ?? (a as { special_effect?: string } | null)?.special_effect;
			if (a && special) out.push({ source: a.name, text: String(special), image: a.image });
		}
		return out;
	});

	const hasWeapon = $derived(!!(build.weapons.right || build.weapons.left));
	const hasSpells = $derived(build.spells.some((s) => s !== null));
</script>

<div class="space-y-3">
	<!-- Niveau + soft caps -->
	<div class="card !p-3">
		<div class="flex items-center justify-between mb-1">
			<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase">Level</h3>
			<span class="font-cinzel text-gold text-base">≈ {level}</span>
		</div>
		{#if statWarnings.length}
			<div class="flex flex-wrap gap-1 mt-1">
				{#each statWarnings as w}
					<span
						class="text-[10px] font-cinzel rounded px-1.5 py-0.5 border
							{w.status.level === 2 ? 'border-rose-400/50 text-rose-300 bg-rose-400/10' : 'border-amber-400/50 text-amber-300 bg-amber-400/10'}"
						title={w.status.label}
					>
						{STAT_LABEL[w.stat]} {w.value} · {w.status.level === 2 ? 'hard' : 'soft'}
					</span>
				{/each}
			</div>
		{:else}
			<p class="text-parchment/30 text-[11px] italic">No stat past its soft cap</p>
		{/if}
	</div>

	<!-- Equip Load -->
	<div class="card !p-3">
		<div class="flex items-center justify-between mb-1">
			<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase">Equip Load</h3>
			<span class="font-cinzel text-sm" style="color:{ROLL_COLOR[roll]}">{roll}</span>
		</div>
		<div class="h-2.5 bg-dark-800 rounded overflow-hidden border border-dark-400/40">
			<div
				class="h-full transition-all"
				style="width:{Math.min(100, loadRatio * 100).toFixed(1)}%; background:{ROLL_COLOR[roll]};"
			></div>
		</div>
		<p class="text-[11px] text-parchment/50 font-cinzel mt-1 flex justify-between">
			<span>{totalWeight.toFixed(1)} / {maxLoad.toFixed(0)}</span>
			<span class="text-parchment/30">{(loadRatio * 100).toFixed(0)} %</span>
		</p>
	</div>

	<!-- Attack Power -->
	{#if hasWeapon}
		<div class="card !p-3">
			<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">Attack Power</h3>
			<div class="space-y-3">
				{#if build.weapons.right}
					<AttackPowerPanel weapon={build.weapons.right} stats={build.stats} />
				{/if}
				{#if build.weapons.left}
					<AttackPowerPanel weapon={build.weapons.left} stats={build.stats} />
				{/if}
			</div>
		</div>
	{/if}

	<!-- Requirements -->
	{#if reqItems.length}
		<div class="card !p-3">
			<div class="flex items-center justify-between mb-2">
				<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase">Requirements</h3>
				{#if reqHasFail}
					<span class="text-[10px] font-cinzel text-rose-300 border border-rose-400/50 bg-rose-400/10 rounded px-1.5 py-0.5">Some unmet</span>
				{:else}
					<span class="text-[10px] font-cinzel text-emerald-300 border border-emerald-400/50 bg-emerald-400/10 rounded px-1.5 py-0.5">All met</span>
				{/if}
			</div>
			<div class="space-y-1.5">
				{#each reqItems as it}
					<div class="flex items-center gap-2 text-xs">
						{#if it.image}
							<img src={it.image} alt={it.label} class="w-5 h-5 object-contain bg-dark-900 rounded shrink-0"
								onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
						{/if}
						<span class="text-parchment/70 truncate flex-1">{it.label}</span>
						<div class="flex gap-1 shrink-0">
							{#each it.reqs as r}
								<span
									class="text-[10px] font-cinzel rounded px-1 py-0.5 border
										{r.ok ? 'border-emerald-400/40 text-emerald-300/90' : 'border-rose-400/50 text-rose-300 bg-rose-400/10'}"
									title="Need {r.need}, have {r.have}"
								>
									{STAT_LABEL[r.stat]} {r.have}/{r.need}
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Memory slots -->
	{#if hasSpells || slotsAvail > 0}
		<div class="card !p-3">
			<div class="flex items-center justify-between mb-1">
				<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase">Memory Slots</h3>
				<span
					class="font-cinzel text-sm {slotsUsed > slotsAvail ? 'text-rose-300' : 'text-gold'}"
				>
					{slotsUsed} / {slotsAvail}
				</span>
			</div>
			{#if slotsUsed > slotsAvail}
				<p class="text-[11px] text-rose-300/80 italic">Need more Mind to equip all spells.</p>
			{/if}
		</div>
	{/if}

	<!-- Defense + Résistances -->
	{#if hasArmor}
		<div class="card !p-3">
			<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2 text-center">Damage Negation</h3>
			<RadarChart labels={[...negCats]} values={negValues} size={200} />
		</div>
		<div class="card !p-3">
			<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">Resistances</h3>
			<BarList
				items={resCats.map((c, i) => ({ label: c.slice(0, 3), value: resValues[i] }))}
				format={(n) => String(Math.round(n))}
				labelWidth="2.5rem"
			/>
		</div>
	{/if}

	<!-- Effets cumulés -->
	{#if effects.length}
		<div class="card !p-3">
			<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">Passive Effects</h3>
			<div class="space-y-1.5">
				{#each effects as e}
					<div class="flex items-start gap-2">
						{#if e.image}
							<img src={e.image} alt={e.source} class="w-5 h-5 object-contain bg-dark-900 rounded shrink-0 mt-0.5"
								onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')} />
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-parchment/70 text-[11px] truncate">{e.source}</p>
							<p class="text-gold/50 text-[11px] italic">{e.text}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
