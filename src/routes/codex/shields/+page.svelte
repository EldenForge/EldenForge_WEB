<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchShields } from '$lib/api/items';
	import type { Shield } from '$lib/types';
	import CodexHeader from '$lib/components/CodexHeader.svelte';
	import CodexCard from '$lib/components/CodexCard.svelte';

	let items = $state<Shield[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');
	let category = $state('');

	onMount(async () => {
		try {
			items = await fetchShields();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	});

	const categories = $derived(
		Array.from(new Set(items.map((s) => s.category).filter(Boolean))).sort()
	);

	const filtered = $derived(
		items
			.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
			.filter((s) => !category || s.category === category)
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	function guardBadges(s: Shield): string[] {
		const out: string[] = [];
		const phys = (s.defence || []).find((d) => d.name === 'Phy');
		if (phys && phys.amount) out.push(`Guard ${phys.amount}`);
		if (typeof s.weight === 'number') out.push(`${s.weight} wt`);
		return out;
	}
</script>

<svelte:head><title>Shields — Codex — Elden Forge</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<CodexHeader title="SHIELDS" subtitle="Shields" />

	<div class="flex flex-wrap gap-3 mb-5 items-center">
		<input
			type="text"
			placeholder="Search..."
			bind:value={search}
			class="flex-1 min-w-[12rem] bg-dark-800 border border-dark-400 rounded px-3 py-1.5 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-gold/50"
		/>
		<select
			bind:value={category}
			style="appearance:none; -webkit-appearance:none; -moz-appearance:none; background-image:none;"
			class="bg-dark-800 border border-dark-400 rounded text-sm text-parchment/80 pl-3 pr-7 py-1.5 font-cinzel cursor-pointer focus:outline-none focus:border-gold/50"
		>
			<option value="">All categories</option>
			{#each categories as c}
				<option value={c}>{c}</option>
			{/each}
		</select>
		<span class="text-parchment/40 text-xs">{filtered.length} / {items.length}</span>
	</div>

	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center"><p class="text-red-400">{error}</p></div>
	{:else if filtered.length === 0}
		<p class="text-center text-parchment/40 italic py-12">No shield matches your filters.</p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each filtered as s (s.id)}
				<CodexCard
					image={s.image}
					name={s.name}
					subtitle={s.category}
					badges={guardBadges(s)}
					description={s.description}
					findBuildsHref={`/?item=${encodeURIComponent(s.id)}`}
				/>
			{/each}
		</div>
	{/if}
</div>
