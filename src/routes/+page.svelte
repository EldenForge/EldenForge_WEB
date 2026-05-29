<script lang="ts">
	import { onMount } from 'svelte';
	import { listPublicBuilds, type PublicBuildListItem } from '$lib/api/builds';
	import BuildCard from '$lib/components/BuildCard.svelte';
	import TagFilter from '$lib/components/TagFilter.svelte';

	let builds = $state<PublicBuildListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let selectedTags = $state<string[]>([]);
	let sort = $state<'recent' | 'popular'>('recent');
	let offset = $state(0);
	const LIMIT = 20;
	let hasMore = $state(false);

	let searchTimer: ReturnType<typeof setTimeout>;

	async function load(reset = true) {
		loading = true;
		error = null;
		try {
			const page = await listPublicBuilds({
				search: search || undefined,
				tags: selectedTags,
				sort,
				limit: LIMIT,
				offset: reset ? 0 : offset
			});
			if (reset) {
				builds = page;
				offset = page.length;
			} else {
				builds = [...builds, ...page];
				offset += page.length;
			}
			hasMore = page.length === LIMIT;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load builds';
		} finally {
			loading = false;
		}
	}

	function onSearchInput() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => load(true), 300);
	}

	function onTagsChange(tags: string[]) {
		selectedTags = tags;
		load(true);
	}

	function setSort(s: 'recent' | 'popular') {
		sort = s;
		load(true);
	}

	onMount(() => load(true));
</script>

<svelte:head><title>Elden Forge — Explore Builds</title></svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<header class="text-center mb-8">
		<h1 class="font-cinzel text-4xl text-gold tracking-[0.25em]">EXPLORE BUILDS</h1>
		<p class="text-parchment/40 font-cinzel tracking-[0.2em] text-xs uppercase mt-2">
			Community creations
		</p>
	</header>

	<div class="space-y-4 mb-8">
		<input
			type="text"
			bind:value={search}
			oninput={onSearchInput}
			placeholder="Search by build name or author..."
			class="w-full bg-dark-800 border border-dark-400 text-parchment rounded-lg px-4 py-2.5
				text-sm placeholder:text-parchment/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
		/>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<TagFilter selected={selectedTags} onchange={onTagsChange} />
			<div class="flex gap-1 shrink-0">
				<button
					type="button"
					onclick={() => setSort('recent')}
					class="text-xs font-cinzel px-3 py-1.5 rounded border transition-colors cursor-pointer
						{sort === 'recent' ? 'text-gold bg-gold/15 border-gold/50' : 'text-parchment/50 border-dark-400'}"
				>
					Recent
				</button>
				<button
					type="button"
					onclick={() => setSort('popular')}
					class="text-xs font-cinzel px-3 py-1.5 rounded border transition-colors cursor-pointer
						{sort === 'popular' ? 'text-gold bg-gold/15 border-gold/50' : 'text-parchment/50 border-dark-400'}"
				>
					Popular
				</button>
			</div>
		</div>
	</div>

	{#if loading && builds.length === 0}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center"><p class="text-red-400">{error}</p></div>
	{:else if builds.length === 0}
		<div class="card text-center py-12">
			<p class="text-parchment/50 italic">No public builds found.</p>
			<a href="/build" class="btn-gold inline-block mt-4">Create the first one</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each builds as build (build.id)}
				<BuildCard {build} />
			{/each}
		</div>
		{#if hasMore}
			<div class="text-center mt-8">
				<button class="btn-reset" onclick={() => load(false)} disabled={loading}>
					{loading ? 'Loading...' : 'Load more'}
				</button>
			</div>
		{/if}
	{/if}
</div>
