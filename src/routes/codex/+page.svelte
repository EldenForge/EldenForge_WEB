<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchAshes } from '$lib/api/items';
	import type { AshOfWar } from '$lib/types';

	let ashes = $state<AshOfWar[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');
	let affinity = $state<string>('');

	onMount(async () => {
		try {
			ashes = await fetchAshes();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	});

	const affinities = $derived(
		Array.from(new Set(ashes.map((a) => a.affinity).filter((x): x is string => !!x))).sort()
	);

	const filtered = $derived(
		ashes
			.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()))
			.filter((a) => !affinity || a.affinity === affinity)
			.sort((a, b) => a.name.localeCompare(b.name))
	);
</script>

<svelte:head><title>Codex — Ashes of War — Elden Forge</title></svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
	<header class="text-center mb-6">
		<h1 class="font-cinzel text-3xl text-gold tracking-[0.2em]">CODEX</h1>
		<div class="flex items-center justify-center gap-3 mt-3">
			<div class="h-px w-16 bg-gradient-to-r from-transparent to-gold/40"></div>
			<span class="text-gold/50 text-xs">&#9670;</span>
			<div class="h-px w-16 bg-gradient-to-l from-transparent to-gold/40"></div>
		</div>
		<p class="text-parchment/50 font-cinzel tracking-widest text-xs uppercase mt-2">Ashes of War</p>
	</header>

	<div class="flex flex-wrap gap-3 mb-5 items-center">
		<input
			type="text"
			placeholder="Search..."
			bind:value={search}
			class="flex-1 min-w-[12rem] bg-dark-800 border border-dark-400 rounded px-3 py-1.5 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-gold/50"
		/>
		<select
			bind:value={affinity}
			style="appearance:none; -webkit-appearance:none; -moz-appearance:none; background-image:none;"
			class="bg-dark-800 border border-dark-400 rounded text-sm text-parchment/80 pl-3 pr-7 py-1.5 font-cinzel cursor-pointer focus:outline-none focus:border-gold/50"
		>
			<option value="">All affinities</option>
			{#each affinities as a}
				<option value={a}>{a}</option>
			{/each}
		</select>
		<span class="text-parchment/40 text-xs">{filtered.length} / {ashes.length}</span>
	</div>

	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center"><p class="text-red-400">{error}</p></div>
	{:else if filtered.length === 0}
		<p class="text-center text-parchment/40 italic py-12">No Ash matches your filters.</p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each filtered as ash (ash.id)}
				<div class="card flex gap-3">
					{#if ash.image}
						<img
							src={ash.image}
							alt={ash.name}
							class="w-14 h-14 object-contain bg-dark-800 rounded shrink-0"
							onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
						/>
					{/if}
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<h3 class="font-cinzel text-gold text-sm truncate">{ash.name}</h3>
							{#if ash.affinity}
								<span class="text-[10px] text-gold/70 border border-gold/25 rounded px-1.5 py-0.5 shrink-0">{ash.affinity}</span>
							{/if}
						</div>
						{#if ash.skill}
							<p class="text-parchment/70 text-xs mt-0.5"><span class="text-gold/50">Skill:</span> {ash.skill}</p>
						{/if}
						{#if ash.description}
							<p class="text-parchment/50 text-[11px] mt-1 line-clamp-3">{ash.description}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
