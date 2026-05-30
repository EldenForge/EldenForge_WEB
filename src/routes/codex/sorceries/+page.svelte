<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchSorceries } from '$lib/api/items';
	import type { Sorcery } from '$lib/types';
	import CodexHeader from '$lib/components/CodexHeader.svelte';
	import CodexCard from '$lib/components/CodexCard.svelte';

	let items = $state<Sorcery[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');

	onMount(async () => {
		try {
			items = await fetchSorceries();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	});

	const filtered = $derived(
		items
			.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	function spellBadges(s: Sorcery): string[] {
		const out: string[] = [];
		if (s.cost) out.push(`${s.cost} FP`);
		if (s.slots) out.push(`${s.slots} slot${s.slots > 1 ? 's' : ''}`);
		return out;
	}
</script>

<svelte:head><title>Sorceries — Codex — Elden Forge</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<CodexHeader title="SORCERIES" subtitle="Sorceries" />

	<div class="flex flex-wrap gap-3 mb-5 items-center">
		<input
			type="text"
			placeholder="Search..."
			bind:value={search}
			class="flex-1 min-w-[12rem] bg-dark-800 border border-dark-400 rounded px-3 py-1.5 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-gold/50"
		/>
		<span class="text-parchment/40 text-xs">{filtered.length} / {items.length}</span>
	</div>

	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center"><p class="text-red-400">{error}</p></div>
	{:else if filtered.length === 0}
		<p class="text-center text-parchment/40 italic py-12">No sorcery matches your search.</p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each filtered as s (s.id)}
				<CodexCard
					image={s.image}
					name={s.name}
					subtitle={s.effects}
					badges={spellBadges(s)}
					description={s.description}
				/>
			{/each}
		</div>
	{/if}
</div>
