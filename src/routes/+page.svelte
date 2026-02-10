<script lang="ts">
	import { onMount } from 'svelte';
	import { buildStore } from '$lib/stores/build';
	import { loadAllItems } from '$lib/api/items';
	import type { Armor, Talisman, Weapon } from '$lib/types';

	let armors = $state<Armor[]>([]);
	let talismans = $state<Talisman[]>([]);
	let weapons = $state<Weapon[]>([]);
	let shields = $state<Weapon[]>([]);
	let loading = $state(true);
	let error = $state('');
	let copied = $state(false);

	let headArmors = $derived(armors.filter((a) => a.category === 'Helm'));
	let chestArmors = $derived(armors.filter((a) => a.category === 'Chest Armor'));
	let handArmors = $derived(armors.filter((a) => a.category === 'Gauntlets'));
	let legArmors = $derived(armors.filter((a) => a.category === 'Leg Armor'));
	let leftHandOptions = $derived(
		[...weapons, ...shields].sort((a, b) => a.name.localeCompare(b.name))
	);

	let totalWeight = $derived(
		($buildStore.armor.head?.weight ?? 0) +
			($buildStore.armor.chest?.weight ?? 0) +
			($buildStore.armor.hands?.weight ?? 0) +
			($buildStore.armor.legs?.weight ?? 0) +
			($buildStore.weapons.right?.weight ?? 0) +
			($buildStore.weapons.left?.weight ?? 0)
	);

	let hasBuild = $derived(
		$buildStore.armor.head !== null ||
			$buildStore.armor.chest !== null ||
			$buildStore.armor.hands !== null ||
			$buildStore.armor.legs !== null ||
			$buildStore.talismans.some((t) => t !== null) ||
			$buildStore.weapons.right !== null ||
			$buildStore.weapons.left !== null
	);

	onMount(async () => {
		try {
			const data = await loadAllItems();
			armors = data.armors;
			talismans = data.talismans;
			weapons = data.weapons;
			shields = data.shields;
		} catch (e) {
			error = 'Failed to load data. Make sure the API is running (uvicorn main:app on port 8000).';
			console.error(e);
		} finally {
			loading = false;
		}
	});

	function selectArmor(slot: 'head' | 'chest' | 'hands' | 'legs', list: Armor[], e: Event) {
		const id = (e.target as HTMLSelectElement).value;
		buildStore.setArmor(slot, id ? (list.find((a) => a.id === id) ?? null) : null);
	}

	function selectTalisman(index: number, e: Event) {
		const id = (e.target as HTMLSelectElement).value;
		buildStore.setTalisman(index, id ? (talismans.find((t) => t.id === id) ?? null) : null);
	}

	function selectWeapon(slot: 'right' | 'left', list: Weapon[], e: Event) {
		const id = (e.target as HTMLSelectElement).value;
		buildStore.setWeapon(slot, id ? (list.find((w) => w.id === id) ?? null) : null);
	}

	async function copyBuild() {
		const b = $buildStore;
		const json = JSON.stringify(
			{
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
				}
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
			<!-- Left column: Selectors -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Armor Section -->
				<section class="card">
					<h2 class="section-title">Armor</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="slot-label" for="armor-head">Head</label>
							<select
								id="armor-head"
								class="select-elden"
								value={$buildStore.armor.head?.id ?? ''}
								onchange={(e) => selectArmor('head', headArmors, e)}
							>
								<option value="">-- Select head armor --</option>
								{#each headArmors as item (item.id)}
									<option value={item.id}>{item.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="slot-label" for="armor-chest">Chest</label>
							<select
								id="armor-chest"
								class="select-elden"
								value={$buildStore.armor.chest?.id ?? ''}
								onchange={(e) => selectArmor('chest', chestArmors, e)}
							>
								<option value="">-- Select chest armor --</option>
								{#each chestArmors as item (item.id)}
									<option value={item.id}>{item.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="slot-label" for="armor-hands">Hands</label>
							<select
								id="armor-hands"
								class="select-elden"
								value={$buildStore.armor.hands?.id ?? ''}
								onchange={(e) => selectArmor('hands', handArmors, e)}
							>
								<option value="">-- Select gauntlets --</option>
								{#each handArmors as item (item.id)}
									<option value={item.id}>{item.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="slot-label" for="armor-legs">Legs</label>
							<select
								id="armor-legs"
								class="select-elden"
								value={$buildStore.armor.legs?.id ?? ''}
								onchange={(e) => selectArmor('legs', legArmors, e)}
							>
								<option value="">-- Select leg armor --</option>
								{#each legArmors as item (item.id)}
									<option value={item.id}>{item.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</section>

				<!-- Talismans Section -->
				<section class="card">
					<h2 class="section-title">Talismans</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each [0, 1, 2, 3] as i}
							<div>
								<label class="slot-label" for="talisman-{i}">Talisman {i + 1}</label>
								<select
									id="talisman-{i}"
									class="select-elden"
									value={$buildStore.talismans[i]?.id ?? ''}
									onchange={(e) => selectTalisman(i, e)}
								>
									<option value="">-- Select talisman --</option>
									{#each talismans as item (item.id)}
										<option value={item.id}>{item.name}</option>
									{/each}
								</select>
							</div>
						{/each}
					</div>
				</section>

				<!-- Weapons Section -->
				<section class="card">
					<h2 class="section-title">Weapons</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="slot-label" for="weapon-right">Right Hand</label>
							<select
								id="weapon-right"
								class="select-elden"
								value={$buildStore.weapons.right?.id ?? ''}
								onchange={(e) => selectWeapon('right', weapons, e)}
							>
								<option value="">-- Select weapon --</option>
								{#each weapons as item (item.id)}
									<option value={item.id}>{item.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="slot-label" for="weapon-left">Left Hand</label>
							<select
								id="weapon-left"
								class="select-elden"
								value={$buildStore.weapons.left?.id ?? ''}
								onchange={(e) => selectWeapon('left', leftHandOptions, e)}
							>
								<option value="">-- Select weapon / shield --</option>
								{#each leftHandOptions as item (item.id)}
									<option value={item.id}>{item.name} ({item.category})</option>
								{/each}
							</select>
						</div>
					</div>
				</section>
			</div>

			<!-- Right column: Build Summary -->
			<aside class="lg:col-span-1">
				<div class="card lg:sticky lg:top-8 border-t-2 border-t-gold/40">
					<h2 class="section-title">Build Summary</h2>

					{#if !hasBuild}
						<p class="text-parchment/30 text-sm text-center py-8 italic font-cinzel">
							Select items to forge your build
						</p>
					{:else}
						<!-- Armor summary -->
						<div class="mb-5">
							<h3
								class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2"
							>
								Armor
							</h3>
							{#each [
								{ label: 'Head', item: $buildStore.armor.head },
								{ label: 'Chest', item: $buildStore.armor.chest },
								{ label: 'Hands', item: $buildStore.armor.hands },
								{ label: 'Legs', item: $buildStore.armor.legs }
							] as slot}
								<div
									class="flex justify-between items-center py-1.5 border-b border-dark-400/50"
								>
									<span class="text-parchment/50 text-xs w-14 shrink-0"
										>{slot.label}</span
									>
									{#if slot.item}
										<span class="text-parchment text-sm flex-1 truncate px-2"
											>{slot.item.name}</span
										>
										<span class="text-gold/60 text-xs shrink-0"
											>{slot.item.weight}</span
										>
									{:else}
										<span class="text-parchment/20 text-sm flex-1 px-2 italic"
											>Empty</span
										>
										<span class="text-parchment/10 text-xs shrink-0"
											>&mdash;</span
										>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Talismans summary -->
						<div class="mb-5">
							<h3
								class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2"
							>
								Talismans
							</h3>
							{#each $buildStore.talismans as talisman, i}
								<div class="py-1.5 border-b border-dark-400/50">
									<div class="flex items-center">
										<span class="text-parchment/50 text-xs w-14 shrink-0"
											>Slot {i + 1}</span
										>
										{#if talisman}
											<span
												class="text-parchment text-sm flex-1 truncate px-2"
												>{talisman.name}</span
											>
										{:else}
											<span
												class="text-parchment/20 text-sm flex-1 px-2 italic"
												>Empty</span
											>
										{/if}
									</div>
									{#if talisman?.effect}
										<p class="text-gold/40 text-xs ml-14 mt-0.5 italic">
											{talisman.effect}
										</p>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Weapons summary -->
						<div class="mb-5">
							<h3
								class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-2"
							>
								Weapons
							</h3>
							{#each [
								{ label: 'Right', item: $buildStore.weapons.right },
								{ label: 'Left', item: $buildStore.weapons.left }
							] as slot}
								<div
									class="flex justify-between items-center py-1.5 border-b border-dark-400/50"
								>
									<span class="text-parchment/50 text-xs w-14 shrink-0"
										>{slot.label}</span
									>
									{#if slot.item}
										<span class="text-parchment text-sm flex-1 truncate px-2"
											>{slot.item.name}</span
										>
										<span class="text-gold/60 text-xs shrink-0"
											>{slot.item.weight}</span
										>
									{:else}
										<span class="text-parchment/20 text-sm flex-1 px-2 italic"
											>Empty</span
										>
										<span class="text-parchment/10 text-xs shrink-0"
											>&mdash;</span
										>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Total weight -->
						<div class="flex justify-between items-center pt-3 border-t border-gold/20">
							<span class="font-cinzel text-gold text-sm tracking-wider"
								>Total Weight</span
							>
							<span class="font-cinzel text-gold text-lg"
								>{totalWeight.toFixed(1)}</span
							>
						</div>
					{/if}

					<!-- Action buttons -->
					<div class="flex gap-3 mt-6">
						<button class="btn-reset flex-1" onclick={() => buildStore.reset()}>
							Reset
						</button>
						<button
							class="btn-gold flex-1"
							onclick={copyBuild}
							disabled={!hasBuild}
						>
							{copied ? 'Copied!' : 'Copy JSON'}
						</button>
					</div>
				</div>
			</aside>
		</div>
	</main>
{/if}
