<script lang="ts">
	import { onMount } from 'svelte';
	import { loadAllItems } from '$lib/api/items';
	import CodexHeader from '$lib/components/CodexHeader.svelte';

	interface Category {
		slug: string;
		label: string;
		hint: string;
		count: number;
		preview: string | undefined;
	}

	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const data = await loadAllItems();
			const pick = <T extends { image?: string }>(arr: T[]) => arr.find((x) => x.image)?.image;
			categories = [
				{ slug: 'weapons', label: 'Weapons', hint: 'Swords, axes, spears, bows, staves...', count: data.weapons.length, preview: pick(data.weapons) },
				{ slug: 'shields', label: 'Shields', hint: 'Small, medium, greatshields', count: data.shields.length, preview: pick(data.shields) },
				{ slug: 'armors', label: 'Armors', hint: 'Helm, chest, gauntlets, greaves', count: data.armors.length, preview: pick(data.armors) },
				{ slug: 'talismans', label: 'Talismans', hint: 'Passive bonuses, 4 slots', count: data.talismans.length, preview: pick(data.talismans) },
				{ slug: 'sorceries', label: 'Sorceries', hint: 'Intelligence-based spells', count: data.sorceries.length, preview: pick(data.sorceries) },
				{ slug: 'incantations', label: 'Incantations', hint: 'Faith / Arcane-based spells', count: data.incantations.length, preview: pick(data.incantations) },
				{ slug: 'spirits', label: 'Spirit Ashes', hint: 'Summonable allies', count: data.spirits.length, preview: pick(data.spirits) },
				{ slug: 'ashes', label: 'Ashes of War', hint: 'Weapon skills + affinities', count: data.ashes_of_war.length, preview: pick(data.ashes_of_war) },
				{ slug: 'ammos', label: 'Ammo', hint: 'Arrows, bolts, greatbolts', count: data.ammos.length, preview: pick(data.ammos) }
			];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>Codex — Elden Forge</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<CodexHeader title="CODEX" />
	<p class="text-center text-parchment/50 font-cinzel tracking-widest text-xs uppercase -mt-3 mb-8">
		Encyclopedia of the Lands Between
	</p>

	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center"><p class="text-red-400">{error}</p></div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each categories as cat}
				<a href="/codex/{cat.slug}" class="card group block hover:border-gold/40 transition-colors">
					<div class="flex items-center gap-4">
						{#if cat.preview}
							<div class="w-16 h-16 shrink-0 bg-dark-800 rounded flex items-center justify-center overflow-hidden">
								<img
									src={cat.preview}
									alt=""
									aria-hidden="true"
									class="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
									loading="lazy"
									onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
								/>
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-2">
								<h2 class="font-cinzel text-gold text-lg tracking-wider truncate">{cat.label}</h2>
								<span class="text-[10px] text-gold/50 font-cinzel tracking-widest shrink-0">{cat.count}</span>
							</div>
							<p class="text-parchment/50 text-xs mt-1 italic">{cat.hint}</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
