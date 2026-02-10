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
		CharacterStats
	} from '$lib/types';

	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import EquipmentFrame from '$lib/components/EquipmentFrame.svelte';
	import SpellGrid from '$lib/components/SpellGrid.svelte';
	import ItemPicker from '$lib/components/ItemPicker.svelte';

	// ── Data ──
	let armors = $state<Armor[]>([]);
	let talismans = $state<Talisman[]>([]);
	let weapons = $state<Weapon[]>([]);
	let shields = $state<Weapon[]>([]);
	let sorceries = $state<Sorcery[]>([]);
	let incantations = $state<Incantation[]>([]);
	let spirits = $state<Spirit[]>([]);
	let loading = $state(true);
	let error = $state('');
	let copied = $state(false);

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
		} catch (e) {
			error = 'Failed to load data. Make sure the API is running (uvicorn main:app on port 8000).';
			console.error(e);
		} finally {
			loading = false;
		}
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
				spirit: b.spirit?.name ?? null
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

	<main class="max-w-7xl mx-auto px-4 pb-12">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left column: Visual build editor -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Statistics -->
				<section class="card">
					<h2 class="section-title">Statistics</h2>
					<StatsPanel stats={$buildStore.stats} onstatchange={handleStatChange} />
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
				</section>

				<!-- Spells & Spirit -->
				<section class="card">
					<h2 class="section-title">Spells & Spirit</h2>
					<p class="text-parchment/30 text-xs mb-4 -mt-2">
						{totalSpellSlots} memory slot{totalSpellSlots !== 1 ? 's' : ''} used
					</p>
					<SpellGrid
						spells={$buildStore.spells}
						spirit={$buildStore.spirit}
						onspellclick={handleSpellClick}
						onspiritclick={handleSpiritClick}
					/>
				</section>
			</div>

			<!-- Right column: Build Summary -->
			<aside class="lg:col-span-1">
				<div
					class="card lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto border-t-2 border-t-gold/40"
				>
					<h2 class="section-title">Build Summary</h2>

					{#if !hasBuild}
						<p class="text-parchment/30 text-sm text-center py-8 italic font-cinzel">
							Select items to forge your build
						</p>
					{:else}
						<!-- Stats summary -->
						<div class="mb-5">
							<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">
								Statistics
							</h3>
							<div class="grid grid-cols-4 gap-x-2 gap-y-1">
								{#each statLabels as { key, label }}
									<div class="flex justify-between items-center">
										<span class="text-parchment/50 text-[10px]">{label.slice(0, 3)}</span>
										<span class="text-parchment font-cinzel text-sm"
											>{$buildStore.stats[key]}</span
										>
									</div>
								{/each}
							</div>
						</div>

						<!-- Armor summary -->
						<div class="mb-5">
							<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">
								Armor
							</h3>
							{#each [{ label: 'Head', item: $buildStore.armor.head }, { label: 'Chest', item: $buildStore.armor.chest }, { label: 'Hands', item: $buildStore.armor.hands }, { label: 'Legs', item: $buildStore.armor.legs }] as slot}
								<div class="flex items-center gap-2 py-1.5 border-b border-dark-400/50">
									<span class="text-parchment/50 text-xs w-12 shrink-0">{slot.label}</span>
									{#if slot.item}
										{#if slot.item.image}
											<img
												src={slot.item.image}
												alt={slot.item.name}
												class="w-8 h-8 object-contain rounded shrink-0 bg-dark-800"
												onerror={(e) => {
													(e.currentTarget as HTMLImageElement).style.display = 'none';
												}}
											/>
										{/if}
										<span class="text-parchment text-sm flex-1 truncate">{slot.item.name}</span
										>
										<span class="text-gold/60 text-xs shrink-0">{slot.item.weight}</span>
									{:else}
										<span class="text-parchment/20 text-sm flex-1 italic">Empty</span>
										<span class="text-parchment/10 text-xs shrink-0">&mdash;</span>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Talismans summary -->
						<div class="mb-5">
							<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">
								Talismans
							</h3>
							{#each $buildStore.talismans as talisman, i}
								<div class="py-1.5 border-b border-dark-400/50">
									<div class="flex items-center gap-2">
										<span class="text-parchment/50 text-xs w-12 shrink-0">Slot {i + 1}</span
										>
										{#if talisman}
											{#if talisman.image}
												<img
													src={talisman.image}
													alt={talisman.name}
													class="w-8 h-8 object-contain rounded shrink-0 bg-dark-800"
													onerror={(e) => {
														(e.currentTarget as HTMLImageElement).style.display =
															'none';
													}}
												/>
											{/if}
											<span class="text-parchment text-sm flex-1 truncate"
												>{talisman.name}</span
											>
										{:else}
											<span class="text-parchment/20 text-sm flex-1 italic">Empty</span>
										{/if}
									</div>
									{#if talisman?.effect}
										<p class="text-gold/40 text-xs ml-[3.25rem] mt-0.5 italic">
											{talisman.effect}
										</p>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Weapons summary -->
						<div class="mb-5">
							<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">
								Weapons
							</h3>
							{#each [{ label: 'Right', item: $buildStore.weapons.right }, { label: 'Left', item: $buildStore.weapons.left }] as slot}
								<div class="flex items-center gap-2 py-1.5 border-b border-dark-400/50">
									<span class="text-parchment/50 text-xs w-12 shrink-0">{slot.label}</span>
									{#if slot.item}
										{#if slot.item.image}
											<img
												src={slot.item.image}
												alt={slot.item.name}
												class="w-8 h-8 object-contain rounded shrink-0 bg-dark-800"
												onerror={(e) => {
													(e.currentTarget as HTMLImageElement).style.display = 'none';
												}}
											/>
										{/if}
										<span class="text-parchment text-sm flex-1 truncate">{slot.item.name}</span
										>
										<span class="text-gold/60 text-xs shrink-0">{slot.item.weight}</span>
									{:else}
										<span class="text-parchment/20 text-sm flex-1 italic">Empty</span>
										<span class="text-parchment/10 text-xs shrink-0">&mdash;</span>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Spells summary -->
						{#if $buildStore.spells.some((s) => s !== null)}
							<div class="mb-5">
								<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">
									Spells <span class="text-parchment/30 normal-case"
										>({totalSpellSlots} slots)</span
									>
								</h3>
								{#each $buildStore.spells as spell}
									{#if spell}
										<div class="flex items-center gap-2 py-1.5 border-b border-dark-400/50">
											{#if spell.image}
												<img
													src={spell.image}
													alt={spell.name}
													class="w-8 h-8 object-contain rounded shrink-0 bg-dark-800"
													onerror={(e) => {
														(e.currentTarget as HTMLImageElement).style.display =
															'none';
													}}
												/>
											{/if}
											<div class="flex-1 min-w-0">
												<span class="text-parchment text-sm truncate block"
													>{spell.name}</span
												>
												<span class="text-gold/40 text-[10px] italic"
													>{spell.effects} — FP {spell.cost}</span
												>
											</div>
										</div>
									{/if}
								{/each}
							</div>
						{/if}

						<!-- Spirit summary -->
						{#if $buildStore.spirit}
							<div class="mb-5">
								<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2">
									Spirit Ashes
								</h3>
								<div class="flex items-center gap-2 py-1.5 border-b border-dark-400/50">
									{#if $buildStore.spirit.image}
										<img
											src={$buildStore.spirit.image}
											alt={$buildStore.spirit.name}
											class="w-8 h-8 object-contain rounded shrink-0 bg-dark-800"
											onerror={(e) => {
												(e.currentTarget as HTMLImageElement).style.display = 'none';
											}}
										/>
									{/if}
									<div class="flex-1 min-w-0">
										<span class="text-parchment text-sm truncate block"
											>{$buildStore.spirit.name}</span
										>
										<span class="text-gold/40 text-[10px] italic">
											{$buildStore.spirit.effect}
											— FP {$buildStore.spirit.fpCost}{$buildStore.spirit.hpCost
												? ` / HP ${$buildStore.spirit.hpCost}`
												: ''}
										</span>
									</div>
								</div>
							</div>
						{/if}

						<!-- Total weight -->
						<div class="flex justify-between items-center pt-3 border-t border-gold/20">
							<span class="font-cinzel text-gold text-sm tracking-wider">Total Weight</span>
							<span class="font-cinzel text-gold text-lg">{totalWeight.toFixed(1)}</span>
						</div>
					{/if}

					<!-- Action buttons -->
					<div class="flex gap-3 mt-6">
						<button class="btn-reset flex-1" onclick={() => buildStore.reset()}>
							Reset
						</button>
						<button class="btn-gold flex-1" onclick={copyBuild} disabled={!hasBuild}>
							{copied ? 'Copied!' : 'Copy JSON'}
						</button>
					</div>
				</div>
			</aside>
		</div>
	</main>

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
{/if}
