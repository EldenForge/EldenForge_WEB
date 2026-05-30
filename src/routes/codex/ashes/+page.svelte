<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchAshes } from '$lib/api/items';
	import type { AshOfWar } from '$lib/types';
	import CodexHeader from '$lib/components/CodexHeader.svelte';
	import CodexCard from '$lib/components/CodexCard.svelte';

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

<svelte:head><title>Ashes of War — Codex — Elden Forge</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<CodexHeader title="ASHES OF WAR" subtitle="Ashes of War" />

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
				<CodexCard
					image={ash.image}
					name={ash.name}
					subtitle={ash.skill}
					badges={ash.affinity ? [ash.affinity] : []}
					description={ash.description}
				/>
			{/each}
		</div>
	{/if}
</div>
