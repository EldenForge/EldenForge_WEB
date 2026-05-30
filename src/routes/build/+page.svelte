<script lang="ts">
	import { onMount } from 'svelte';
	import { buildStore } from '$lib/stores/build';
	import { loadAllItems } from '$lib/api/items';
	import type {
		Armor,
		Talisman,
		Weapon,
		Sorcery,
		Incantation,
		Spell,
		Spirit,
		AshOfWar,
		CharacterStats
	} from '$lib/types';

	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import EquipmentFrame from '$lib/components/EquipmentFrame.svelte';
	import SpellGrid from '$lib/components/SpellGrid.svelte';
	import ItemPicker from '$lib/components/ItemPicker.svelte';
	import GuideEditor from '$lib/components/GuideEditor.svelte';
	import { authStore } from '$lib/stores/auth';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import SaveBuildModal from '$lib/components/SaveBuildModal.svelte';
	import AttackPowerPanel from '$lib/components/AttackPowerPanel.svelte';
	import RadarChart from '$lib/components/charts/RadarChart.svelte';
	import BarList from '$lib/components/charts/BarList.svelte';
	import {
		softCapStatus,
		maxEquipLoad,
		rollCategory,
		ROLL_COLOR,
		memorySlotsFromMind,
		characterLevel,
		normalizeStatKey
	} from '$lib/ar/mechanics';
	import { serializeBuild, deserializeBuild, type BuildPayload } from '$lib/builds/serialize';
	import { getBuild, type BuildIntent } from '$lib/api/builds';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// ── Data ──
	let armors = $state<Armor[]>([]);
	let talismans = $state<Talisman[]>([]);
	let weapons = $state<Weapon[]>([]);
	let shields = $state<Weapon[]>([]);
	let sorceries = $state<Sorcery[]>([]);
	let incantations = $state<Incantation[]>([]);
	let spirits = $state<Spirit[]>([]);
	let ashes = $state<AshOfWar[]>([]);
	let loading = $state(true);
	let error = $state('');
	let copied = $state(false);
	let saveModalOpen = $state(false);
	let authModalOpen = $state(false);
	let savePayload = $state<BuildPayload>({
		stats: { vigor: 10, mind: 10, endurance: 10, strength: 10, dexterity: 10, intelligence: 10, faith: 10, arcane: 10 },
		armor: { head: null, chest: null, hands: null, legs: null },
		talismans: [null, null, null, null],
		weapons: { right: null, left: null },
		spells: [null, null, null, null, null, null, null, null, null, null],
		spirit: null,
		guide: ''
	});
	let loadedBuildId = $state<string | null>(null);
	let loadedBuildMeta = $state<{ name: string; description: string | null; is_public: boolean; tags: string[]; intent: BuildIntent } | null>(null);

	// ── Derived item lists ──
	let headArmors = $derived(armors.filter((a) => a.category === 'Helm'));
	let chestArmors = $derived(armors.filter((a) => a.category === 'Chest Armor'));
	let handArmors = $derived(armors.filter((a) => a.category === 'Gauntlets'));
	let legArmors = $derived(armors.filter((a) => a.category === 'Leg Armor'));
	let leftHandOptions = $derived(
		[...weapons, ...shields].sort((a, b) => a.name.localeCompare(b.name))
	);
	let allSpells = $derived(
		[...sorceries, ...incantations].sort((a, b) => a.name.localeCompare(b.name))
	);

	// All items for guide pings
	let allGuideItems = $derived(
		[...weapons, ...shields, ...armors, ...talismans, ...sorceries, ...incantations, ...spirits].sort(
			(a, b) => a.name.localeCompare(b.name)
		)
	);

	// ── Picker state ──
	let pickerOpen = $state(false);
	let pickerTitle = $state('');
	let pickerItems = $state<{ id: string; name: string; image?: string | null }[]>([]);
	let pickerSelectedId = $state<string | null>(null);
	let pickerAction = $state<(item: { id: string; name: string; [key: string]: unknown } | null) => void>(() => {});

	function openPicker(
		title: string,
		items: { id: string; name: string; image?: string | null }[],
		selectedId: string | null,
		action: (item: { id: string; name: string; [key: string]: unknown } | null) => void
	) {
		pickerTitle = title;
		pickerItems = items;
		pickerSelectedId = selectedId;
		pickerAction = action;
		pickerOpen = true;
	}

	function closePicker() {
		pickerOpen = false;
	}

	// ── Slot click handlers ──
	function handleEquipmentSlotClick(category: string, slot: string) {
		if (category === 'armor') {
			const slotMap: Record<string, { list: Armor[]; label: string }> = {
				head: { list: headArmors, label: 'Head Armor' },
				chest: { list: chestArmors, label: 'Chest Armor' },
				hands: { list: handArmors, label: 'Gauntlets' },
				legs: { list: legArmors, label: 'Leg Armor' }
			};
			const info = slotMap[slot];
			if (!info) return;
			const currentId = $buildStore.armor[slot as keyof typeof $buildStore.armor]?.id ?? null;
			openPicker(info.label, info.list, currentId, (item) => {
				buildStore.setArmor(
					slot as 'head' | 'chest' | 'hands' | 'legs',
					item ? (info.list.find((a) => a.id === item.id) ?? null) : null
				);
				closePicker();
			});
		} else if (category === 'weapon') {
			const isLeft = slot === 'left';
			const label = isLeft ? 'Left Hand' : 'Right Hand';
			const list = isLeft ? leftHandOptions : weapons;
			const currentId = $buildStore.weapons[slot as 'right' | 'left']?.id ?? null;
			openPicker(label, list, currentId, (item) => {
				buildStore.setWeapon(
					slot as 'right' | 'left',
					item ? (list.find((w) => w.id === item.id) ?? null) : null
				);
				closePicker();
			});
		} else if (category === 'talisman') {
			const idx = parseInt(slot);
			const currentId = $buildStore.talismans[idx]?.id ?? null;
			openPicker(`Talisman ${idx + 1}`, talismans, currentId, (item) => {
				buildStore.setTalisman(idx, item ? (talismans.find((t) => t.id === item.id) ?? null) : null);
				closePicker();
			});
		}
	}

	function handleSpellClick(index: number) {
		const currentId = $buildStore.spells[index]?.id ?? null;
		openPicker(`Spell ${index + 1}`, allSpells, currentId, (item) => {
			buildStore.setSpell(index, item ? (allSpells.find((s) => s.id === item.id) ?? null) : null);
			closePicker();
		});
	}

	function handleSpiritClick() {
		const currentId = $buildStore.spirit?.id ?? null;
		openPicker('Spirit Ashes', spirits, currentId, (item) => {
			buildStore.setSpirit(item ? (spirits.find((s) => s.id === item.id) ?? null) : null);
			closePicker();
		});
	}

	function handleAshClick(slot: 'right' | 'left') {
		const currentId = $buildStore.ashes[slot]?.id ?? null;
		const weaponName = $buildStore.weapons[slot]?.name ?? '';
		openPicker(`Ash of War — ${weaponName || slot}`, ashes, currentId, (item) => {
			buildStore.setAsh(slot, item ? (ashes.find((a) => a.id === item.id) ?? null) : null);
			closePicker();
		});
	}

	function handleStatChange(stat: keyof CharacterStats, value: number) {
		buildStore.setStat(stat, value);
	}

	// ── Derived summaries ──
	const statLabels: { key: keyof CharacterStats; label: string }[] = [
		{ key: 'vigor', label: 'Vigor' },
		{ key: 'mind', label: 'Mind' },
		{ key: 'endurance', label: 'Endurance' },
		{ key: 'strength', label: 'Strength' },
		{ key: 'dexterity', label: 'Dexterity' },
		{ key: 'intelligence', label: 'Intelligence' },
		{ key: 'faith', label: 'Faith' },
		{ key: 'arcane', label: 'Arcane' }
	];

	let totalWeight = $derived(
		($buildStore.armor.head?.weight ?? 0) +
			($buildStore.armor.chest?.weight ?? 0) +
			($buildStore.armor.hands?.weight ?? 0) +
			($buildStore.armor.legs?.weight ?? 0) +
			($buildStore.weapons.right?.weight ?? 0) +
			($buildStore.weapons.left?.weight ?? 0)
	);

	let totalSpellSlots = $derived(
		$buildStore.spells.reduce((sum, s) => sum + (s ? (s.slots ?? 1) : 0), 0)
	);

	let hasBuild = $derived(
		$buildStore.armor.head !== null ||
			$buildStore.armor.chest !== null ||
			$buildStore.armor.hands !== null ||
			$buildStore.armor.legs !== null ||
			$buildStore.talismans.some((t) => t !== null) ||
			$buildStore.weapons.right !== null ||
			$buildStore.weapons.left !== null ||
			$buildStore.spells.some((s) => s !== null) ||
			$buildStore.spirit !== null
	);

	// ── Indicateurs d'aide à la décision (calculés en live) ──
	const STATS_KEYS = ['vigor','mind','endurance','strength','dexterity','intelligence','faith','arcane'] as const;
	const STAT_SHORT: Record<(typeof STATS_KEYS)[number], string> = {
		vigor:'Vig',mind:'Mnd',endurance:'End',strength:'Str',dexterity:'Dex',intelligence:'Int',faith:'Fai',arcane:'Arc'
	};

	const charLevel = $derived(characterLevel($buildStore.stats));
	const capWarnings = $derived(
		STATS_KEYS.map((s) => ({ stat: s, value: $buildStore.stats[s], status: softCapStatus(s, $buildStore.stats[s]) }))
			.filter((x) => x.status.level > 0)
	);

	const equipMax = $derived(maxEquipLoad($buildStore.stats.endurance));
	const equipRatio = $derived(totalWeight / equipMax);
	const equipRoll = $derived(rollCategory(equipRatio));

	const slotsAvail = $derived(memorySlotsFromMind($buildStore.stats.mind));
	const slotsUsed = $derived($buildStore.spells.reduce((s, sp) => s + (sp ? sp.slots ?? 1 : 0), 0));

	// Defense + Resistances (armure totale)
	const NEG_CATS = ['Phy','Strike','Slash','Pierce','Magic','Fire','Ligt','Holy'] as const;
	const RES_CATS = ['Immunity','Robustness','Focus','Vitality','Poise'] as const;
	const negValues = $derived.by(() => {
		const sums: Record<string, number> = Object.fromEntries(NEG_CATS.map((c) => [c, 0]));
		for (const piece of [$buildStore.armor.head, $buildStore.armor.chest, $buildStore.armor.hands, $buildStore.armor.legs]) {
			if (!piece) continue;
			const arr = (piece as { dmgNegation?: { name: string; amount: number | string }[] }).dmgNegation;
			if (!Array.isArray(arr)) continue;
			for (const e of arr) if (sums[e.name] !== undefined) sums[e.name] += Number(e.amount) || 0;
		}
		return NEG_CATS.map((c) => Math.round(sums[c] * 10) / 10);
	});
	const resValues = $derived.by(() => {
		const sums: Record<string, number> = Object.fromEntries(RES_CATS.map((c) => [c, 0]));
		for (const piece of [$buildStore.armor.head, $buildStore.armor.chest, $buildStore.armor.hands, $buildStore.armor.legs]) {
			if (!piece) continue;
			const arr = (piece as { resistance?: { name: string; amount: number | string }[] }).resistance;
			if (!Array.isArray(arr)) continue;
			for (const e of arr) if (sums[e.name] !== undefined) sums[e.name] += Number(e.amount) || 0;
		}
		return RES_CATS.map((c) => sums[c]);
	});
	const hasArmor = $derived(!!($buildStore.armor.head || $buildStore.armor.chest || $buildStore.armor.hands || $buildStore.armor.legs));

	// Requirements check (par item équipé qui a des requis)
	function reqsFor(raw: { name: string; amount: number | string }[] | undefined) {
		if (!Array.isArray(raw)) return [];
		return raw
			.map((r) => {
				const k = normalizeStatKey(r.name);
				if (!k) return null;
				const need = Number(r.amount) || 0;
				if (need <= 0) return null;
				const have = $buildStore.stats[k];
				return { stat: k, need, have, ok: have >= need, label: STAT_SHORT[k as (typeof STATS_KEYS)[number]] ?? k };
			})
			.filter((x): x is NonNullable<typeof x> => x !== null);
	}
	const weaponReqs = $derived(
		['right', 'left'].flatMap((slot) => {
			const w = $buildStore.weapons[slot as 'right' | 'left'];
			if (!w) return [];
			const reqs = reqsFor((w as { requiredAttributes?: { name: string; amount: number }[] }).requiredAttributes);
			return reqs.length ? [{ label: w.name, image: w.image, reqs }] : [];
		})
	);
	const spellReqs = $derived(
		$buildStore.spells
			.filter((s): s is NonNullable<typeof s> => s !== null)
			.map((s) => ({ label: s.name, image: s.image, reqs: reqsFor((s as { requires?: { name: string; amount: number }[] }).requires) }))
			.filter((s) => s.reqs.length > 0)
	);

	// Effets cumulés (talismans + armures special)
	const passiveEffects = $derived.by(() => {
		const out: { source: string; text: string; image?: string }[] = [];
		for (const t of $buildStore.talismans) {
			if (t?.effect) out.push({ source: t.name, text: t.effect, image: t.image });
		}
		for (const a of [$buildStore.armor.head, $buildStore.armor.chest, $buildStore.armor.hands, $buildStore.armor.legs]) {
			const sp = (a as { ['special effect']?: string } | null)?.['special effect'];
			if (a && sp) out.push({ source: a.name, text: String(sp), image: a.image });
		}
		return out;
	});

	// ── Lifecycle ──
	onMount(async () => {
		try {
			const data = await loadAllItems();
			armors = data.armors;
			talismans = data.talismans;
			weapons = data.weapons;
			shields = data.shields;
			sorceries = data.sorceries;
			incantations = data.incantations;
			spirits = data.spirits;
			ashes = data.ashes_of_war ?? [];
		} catch (e) {
			error = 'Failed to load data. Make sure the API is running (uvicorn main:app on port 8000).';
			console.error(e);
		} finally {
			loading = false;
		}
	});

	// ── Save build ──
	function openSave() {
		savePayload = serializeBuild($buildStore);
		if (!$authStore.user) {
			authModalOpen = true;
			return;
		}
		saveModalOpen = true;
	}

	function onAuthSuccess() {
		// after login success, open save modal immediately
		saveModalOpen = true;
	}

	let saved = $state(false);

	function onBuildSaved(id: string) {
		loadedBuildId = id;
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}

	// ── Load build from query param ──
	$effect(() => {
		const buildIdParam = $page.url.searchParams.get('build');
		if (!buildIdParam || loading) return;
		if (loadedBuildId === buildIdParam) return; // already loaded

		(async () => {
			try {
				const b = await getBuild(buildIdParam);
				const state = deserializeBuild(b.data as unknown as BuildPayload, {
					armors,
					talismans,
					weapons,
					shields,
					sorceries,
					incantations,
					spirits,
					ashes_of_war: ashes
				});
				buildStore.setAll(state);
				loadedBuildId = b.id;
				loadedBuildMeta = { name: b.name, description: b.description, is_public: b.is_public, tags: b.tags ?? [], intent: b.intent ?? 'pve' };
			} catch (e) {
				console.error('Failed to load build', e);
				// Strip the param so we don't keep retrying
				goto('/build', { replaceState: true });
			}
		})();
	});

	// ── Export build ──
	async function copyBuild() {
		const b = $buildStore;
		const json = JSON.stringify(
			{
				stats: b.stats,
				armor: {
					head: b.armor.head?.name ?? null,
					chest: b.armor.chest?.name ?? null,
					hands: b.armor.hands?.name ?? null,
					legs: b.armor.legs?.name ?? null
				},
				talismans: b.talismans.map((t) => t?.name ?? null),
				weapons: {
					right: b.weapons.right?.name ?? null,
					left: b.weapons.left?.name ?? null
				},
				spells: b.spells.filter((s) => s !== null).map((s) => s!.name),
				spirit: b.spirit?.name ?? null,
				guide: b.guide || null
			},
			null,
			2
		);
		await navigator.clipboard.writeText(json);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<svelte:head>
	<title>Elden Forge — Build Creator</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div
				class="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4"
			></div>
			<p class="text-gold font-cinzel text-xl tracking-widest animate-pulse">Loading...</p>
		</div>
	</div>
{:else if error}
	<div class="flex items-center justify-center min-h-screen">
		<div class="card max-w-md text-center">
			<p class="text-red-400 font-cinzel mb-2 text-lg">Connection Failed</p>
			<p class="text-parchment/60 text-sm">{error}</p>
		</div>
	</div>
{:else}
	<!-- Header -->
	<header class="text-center pt-10 pb-8">
		<h1 class="font-cinzel text-4xl md:text-5xl text-gold tracking-[0.25em] font-semibold">
			ELDEN FORGE
		</h1>
		<div class="flex items-center justify-center gap-3 mt-3 mb-2">
			<div class="h-px w-20 bg-gradient-to-r from-transparent to-gold/40"></div>
			<span class="text-gold/50 text-xs">&#9670;</span>
			<div class="h-px w-20 bg-gradient-to-l from-transparent to-gold/40"></div>
		</div>
		<p class="text-parchment/40 font-cinzel tracking-[0.3em] text-xs uppercase">Build Creator</p>
	</header>

	<main class="max-w-5xl mx-auto px-4 pb-24">
		<div>
			<div class="space-y-6">
				<!-- Statistics -->
				<section class="card">
					<div class="flex items-center justify-between">
						<h2 class="section-title !mb-0">Statistics</h2>
						<div class="flex items-center gap-2">
							<span class="text-xs text-gold/60 font-cinzel tracking-widest uppercase">Lv</span>
							<span class="font-cinzel text-gold text-xl">≈ {charLevel}</span>
						</div>
					</div>
					<StatsPanel stats={$buildStore.stats} onstatchange={handleStatChange} />
					{#if capWarnings.length}
						<div class="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gold/15">
							<span class="text-[10px] text-parchment/40 font-cinzel uppercase tracking-widest mr-1">Caps reached:</span>
							{#each capWarnings as w}
								<span
									class="text-[10px] font-cinzel rounded px-1.5 py-0.5 border
										{w.status.level === 2 ? 'border-rose-400/50 text-rose-300 bg-rose-400/10' : 'border-amber-400/50 text-amber-300 bg-amber-400/10'}"
									title={w.status.label}
								>
									{STAT_SHORT[w.stat]} {w.value} · {w.status.level === 2 ? 'hard' : 'soft'}
								</span>
							{/each}
						</div>
					{/if}
				</section>

				<!-- Equipment (armor + weapons + talismans) -->
				<section class="card">
					<h2 class="section-title">Equipment</h2>
					<EquipmentFrame
						armor={$buildStore.armor}
						weapons={$buildStore.weapons}
						talismans={$buildStore.talismans}
						onslotclick={handleEquipmentSlotClick}
					/>

					<!-- Equip Load -->
					<div class="mt-5 pt-4 border-t border-gold/15">
						<div class="flex items-center justify-between mb-1">
							<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase">Equip Load</h3>
							<span class="font-cinzel text-sm" style="color:{ROLL_COLOR[equipRoll]}">{equipRoll}</span>
						</div>
						<div class="h-2.5 bg-dark-800 rounded overflow-hidden border border-dark-400/40">
							<div class="h-full transition-all" style="width:{Math.min(100, equipRatio * 100).toFixed(1)}%; background:{ROLL_COLOR[equipRoll]};"></div>
						</div>
						<p class="text-[11px] text-parchment/50 font-cinzel mt-1 flex justify-between">
							<span>{totalWeight.toFixed(1)} / {equipMax.toFixed(0)}</span>
							<span class="text-parchment/30">{(equipRatio * 100).toFixed(0)} %</span>
						</p>
					</div>

					<!-- Attack Power per weapon -->
					{#if $buildStore.weapons.right || $buildStore.weapons.left}
						<div class="mt-5 pt-4 border-t border-gold/15">
							<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-3">Attack Power</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#if $buildStore.weapons.right}
									<AttackPowerPanel weapon={$buildStore.weapons.right} stats={$buildStore.stats} />
								{/if}
								{#if $buildStore.weapons.left}
									<AttackPowerPanel weapon={$buildStore.weapons.left} stats={$buildStore.stats} />
								{/if}
							</div>
						</div>
					{/if}

					<!-- Defense + Résistances -->
					{#if hasArmor}
						<div class="mt-5 pt-4 border-t border-gold/15 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
							<div>
								<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2 text-center">Damage Negation</h3>
								<RadarChart labels={[...NEG_CATS]} values={negValues} size={220} />
							</div>
							<div>
								<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">Resistances</h3>
								<BarList
									items={RES_CATS.map((c, i) => ({ label: c.slice(0, 3), value: resValues[i] }))}
									format={(n) => String(Math.round(n))}
									labelWidth="2.5rem"
								/>
							</div>
						</div>
					{/if}
				</section>

				<!-- Ashes of War + requirements armes -->
				{#if $buildStore.weapons.right || $buildStore.weapons.left}
					<section class="card">
						<h2 class="section-title">Ashes of War</h2>
						{#if weaponReqs.length}
							<div class="mb-3 pb-3 border-b border-gold/15 space-y-1.5">
								{#each weaponReqs as it}
									<div class="flex items-center gap-2 text-xs">
										{#if it.image}<img src={it.image} alt={it.label} class="w-5 h-5 object-contain bg-dark-900 rounded shrink-0" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />{/if}
										<span class="text-parchment/70 truncate flex-1">{it.label}</span>
										<div class="flex gap-1 shrink-0">
											{#each it.reqs as r}
												<span
													class="text-[10px] font-cinzel rounded px-1 py-0.5 border
														{r.ok ? 'border-emerald-400/40 text-emerald-300/90' : 'border-rose-400/50 text-rose-300 bg-rose-400/10'}"
													title="Need {r.need}, have {r.have}"
												>
													{r.label} {r.have}/{r.need}
												</span>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}
						<div class="space-y-2">
							{#each ['right', 'left'] as const as slot}
								{@const weapon = $buildStore.weapons[slot]}
								{@const ash = $buildStore.ashes[slot]}
								{#if weapon}
									<div class="flex items-center gap-3 py-1.5 border-b border-dark-400/40 last:border-0">
										<span class="text-parchment/50 text-xs font-cinzel w-12 shrink-0 capitalize">{slot}</span>
										<span class="text-parchment/80 text-sm flex-1 truncate">{weapon.name}</span>
										<button
											type="button"
											onclick={() => handleAshClick(slot)}
											class="flex items-center gap-2 text-xs bg-dark-800 border border-gold/25 hover:border-gold/60 rounded px-2 py-1 transition-colors min-w-[10rem]"
										>
											{#if ash}
												{#if ash.image}
													<img src={ash.image} alt={ash.name} class="w-6 h-6 object-contain bg-dark-900 rounded shrink-0"
														onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
												{/if}
												<span class="text-gold/90 font-cinzel truncate flex-1 text-left">{ash.name}</span>
											{:else}
												<span class="text-parchment/50 italic flex-1 text-left">Assign Ash</span>
											{/if}
										</button>
										{#if ash}
											<button
												type="button"
												onclick={() => buildStore.setAsh(slot, null)}
												aria-label="Remove Ash"
												class="text-parchment/40 hover:text-red-400/80 text-xs px-1"
											>&times;</button>
										{/if}
									</div>
								{/if}
							{/each}
						</div>
					</section>
				{/if}

				<!-- Spells & Spirit -->
				<section class="card">
					<div class="flex items-center justify-between mb-2">
						<h2 class="section-title !mb-0">Spells & Spirit</h2>
						<span class="font-cinzel text-sm {slotsUsed > slotsAvail ? 'text-rose-300' : 'text-gold/80'}">
							Memory: {slotsUsed} / {slotsAvail}
						</span>
					</div>
					{#if slotsUsed > slotsAvail}
						<p class="text-[11px] text-rose-300/80 italic mb-2">Not enough Mind to equip all spells.</p>
					{/if}
					<SpellGrid
						spells={$buildStore.spells}
						spirit={$buildStore.spirit}
						onspellclick={handleSpellClick}
						onspiritclick={handleSpiritClick}
					/>
					{#if spellReqs.length}
						<div class="mt-4 pt-3 border-t border-gold/15 space-y-1.5">
							<p class="text-[10px] text-parchment/40 font-cinzel uppercase tracking-widest mb-1">Spell Requirements</p>
							{#each spellReqs as it}
								<div class="flex items-center gap-2 text-xs">
									{#if it.image}<img src={it.image} alt={it.label} class="w-5 h-5 object-contain bg-dark-900 rounded shrink-0" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />{/if}
									<span class="text-parchment/70 truncate flex-1">{it.label}</span>
									<div class="flex gap-1 shrink-0">
										{#each it.reqs as r}
											<span
												class="text-[10px] font-cinzel rounded px-1 py-0.5 border
													{r.ok ? 'border-emerald-400/40 text-emerald-300/90' : 'border-rose-400/50 text-rose-300 bg-rose-400/10'}"
												title="Need {r.need}, have {r.have}"
											>
												{r.label} {r.have}/{r.need}
											</span>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>
				<!-- Passive Effects (talismans + armures spéciales) -->
				{#if passiveEffects.length}
					<section class="card">
						<h2 class="section-title">Passive Effects</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
							{#each passiveEffects as e}
								<div class="flex items-start gap-2">
									{#if e.image}<img src={e.image} alt={e.source} class="w-6 h-6 object-contain bg-dark-900 rounded shrink-0 mt-0.5" onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')} />{/if}
									<div class="min-w-0 flex-1">
										<p class="text-parchment/80 text-xs truncate font-cinzel">{e.source}</p>
										<p class="text-gold/50 text-[11px] italic">{e.text}</p>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Guide -->
				<section class="card">
					<h2 class="section-title">Guide</h2>
					<GuideEditor
						guide={$buildStore.guide}
						allItems={allGuideItems}
						onchange={(text) => buildStore.setGuide(text)}
					/>
				</section>
			</div>

		</div>
	</main>

	<!-- Action bar fixe en bas de viewport -->
	<div class="fixed bottom-0 inset-x-0 z-40 bg-dark-900/95 backdrop-blur border-t border-gold/30">
		<div class="max-w-2xl mx-auto px-4 py-2 flex gap-3">
			<button class="btn-reset flex-1" onclick={() => buildStore.reset()}>Reset</button>
			<button class="btn-gold flex-1" onclick={openSave} disabled={!hasBuild}>
				{#if saved}
					Saved!
				{:else if loadedBuildId}
					Update
				{:else}
					Save
				{/if}
			</button>
			<button class="btn-gold flex-1" onclick={copyBuild} disabled={!hasBuild}>
				{copied ? 'Copied!' : 'Copy JSON'}
			</button>
		</div>
	</div>

	<!-- Item Picker modal -->
	<ItemPicker
		open={pickerOpen}
		title={pickerTitle}
		items={pickerItems}
		selectedId={pickerSelectedId}
		onselect={(item) => pickerAction(item)}
		onclear={() => pickerAction(null)}
		onclose={closePicker}
	/>

	<!-- Auth Modal (re-opens save after login) -->
	<AuthModal
		open={authModalOpen}
		onclose={() => (authModalOpen = false)}
		onsuccess={onAuthSuccess}
	/>

	<!-- Save Build Modal -->
	<SaveBuildModal
		open={saveModalOpen}
		payload={savePayload}
		existingBuildId={loadedBuildId}
		existingName={loadedBuildMeta?.name ?? ''}
		existingDescription={loadedBuildMeta?.description ?? ''}
		existingIsPublic={loadedBuildMeta?.is_public ?? false}
		existingTags={loadedBuildMeta?.tags ?? []}
		existingIntent={loadedBuildMeta?.intent ?? 'pve'}
		onclose={() => (saveModalOpen = false)}
		onsaved={onBuildSaved}
	/>
{/if}
