<script lang="ts">
	import { onMount } from 'svelte';
	import { listPublicBuilds, type PublicBuildListItem } from '$lib/api/builds';
	import BuildCard from '$lib/components/BuildCard.svelte';
	import TagFilter from '$lib/components/TagFilter.svelte';
	import { loadAllItems } from '$lib/api/items';

	let builds = $state<PublicBuildListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let selectedTags = $state<string[]>([]);
	let sort = $state<'recent' | 'popular' | 'trending'>('recent');
	let offset = $state(0);
	const LIMIT = 20;
	let hasMore = $state(false);

	// Item autocomplete
	interface ItemRef { id: string; name: string; image?: string; category: string }
	let allItems = $state<ItemRef[]>([]);
	let itemQuery = $state('');
	let itemSelected = $state<ItemRef | null>(null);
	let showItemDropdown = $state(false);

	let searchTimer: ReturnType<typeof setTimeout>;

	const itemSuggestions = $derived(
		itemQuery && !itemSelected
			? allItems
					.filter((i) => i.name.toLowerCase().includes(itemQuery.toLowerCase()))
					.slice(0, 8)
			: []
	);

	async function load(reset = true) {
		loading = true;
		error = null;
		try {
			const page = await listPublicBuilds({
				search: search || undefined,
				tags: selectedTags,
				sort,
				item: itemSelected?.id,
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
	function setSort(s: 'recent' | 'popular' | 'trending') {
		sort = s;
		load(true);
	}

	function onItemInput() {
		if (itemSelected) {
			// L'utilisateur retape : on déselectionne et on attend une nouvelle sélection
			itemSelected = null;
		}
		showItemDropdown = true;
	}
	function selectItem(item: ItemRef) {
		itemSelected = item;
		itemQuery = item.name;
		showItemDropdown = false;
		load(true);
	}
	function clearItem() {
		itemSelected = null;
		itemQuery = '';
		showItemDropdown = false;
		load(true);
	}
	function resetFilters() {
		search = '';
		selectedTags = [];
		sort = 'recent';
		clearItem();
	}

	onMount(async () => {
		load(true);
		try {
			const data = await loadAllItems();
			const flat: ItemRef[] = [];
			const push = (arr: { id: string; name: string; image?: string }[], cat: string) => {
				for (const x of arr) flat.push({ id: x.id, name: x.name, image: x.image, category: cat });
			};
			push(data.weapons, 'Weapon');
			push(data.shields, 'Shield');
			push(data.armors, 'Armor');
			push(data.talismans, 'Talisman');
			push(data.sorceries, 'Sorcery');
			push(data.incantations, 'Incantation');
			push(data.spirits, 'Spirit');
			push(data.ashes_of_war ?? [], 'Ash');
			push(data.ammos ?? [], 'Ammo');
			allItems = flat.sort((a, b) => a.name.localeCompare(b.name));
		} catch {
			/* autocomplete optionnel, on ignore */
		}
	});
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
		<!-- Ligne 1: recherche + item autocomplete -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<input
				type="text"
				bind:value={search}
				oninput={onSearchInput}
				placeholder="Search by build name or author..."
				class="bg-dark-800 border border-dark-400 text-parchment rounded-lg px-4 py-2.5
					text-sm placeholder:text-parchment/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
			/>
			<div class="relative">
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={itemQuery}
						oninput={onItemInput}
						onfocus={() => (showItemDropdown = true)}
						onblur={() => setTimeout(() => (showItemDropdown = false), 150)}
						placeholder={allItems.length ? 'Filter by equipped item (start typing…)' : 'Loading items for search…'}
						disabled={!allItems.length}
						class="flex-1 bg-dark-800 border border-dark-400 text-parchment rounded-lg px-4 py-2.5
							text-sm placeholder:text-parchment/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 disabled:opacity-50"
					/>
					{#if itemSelected}
						<button
							type="button"
							onclick={clearItem}
							class="text-xs font-cinzel px-3 py-2 rounded border border-rose-400/40 text-rose-300/80 hover:border-rose-400/70"
						>
							Clear
						</button>
					{/if}
				</div>
				{#if showItemDropdown && itemSuggestions.length}
					<div
						class="absolute left-0 right-0 top-full mt-1 z-30 bg-dark-800 border border-gold/30 rounded-lg overflow-hidden shadow-xl max-h-72 overflow-y-auto"
					>
						{#each itemSuggestions as s (s.id)}
							<button
								type="button"
								class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gold/10 transition-colors"
								onmousedown={() => selectItem(s)}
							>
								{#if s.image}
									<img
										src={s.image}
										alt={s.name}
										class="w-7 h-7 object-contain bg-dark-900 rounded shrink-0"
										onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
									/>
								{:else}
									<div class="w-7 h-7 bg-dark-900 rounded shrink-0"></div>
								{/if}
								<span class="text-sm text-parchment truncate flex-1">{s.name}</span>
								<span class="text-[10px] text-gold/50 font-cinzel uppercase tracking-wider shrink-0">{s.category}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Tags groupés par catégorie -->
		<TagFilter selected={selectedTags} onchange={onTagsChange} />

		<!-- Sort + Reset -->
		<div class="flex items-center justify-end gap-2">
			<div class="flex gap-1">
				{#each [{ id: 'recent', label: 'Recent' }, { id: 'trending', label: 'Trending' }, { id: 'popular', label: 'Popular' }] as opt}
					<button
						type="button"
						onclick={() => setSort(opt.id as 'recent' | 'popular' | 'trending')}
						class="text-xs font-cinzel px-3 py-1.5 rounded border transition-colors cursor-pointer
							{sort === opt.id ? 'text-gold bg-gold/15 border-gold/50' : 'text-parchment/50 border-dark-400 hover:border-gold/30'}"
					>
						{opt.label}
					</button>
				{/each}
			</div>
			<button
				type="button"
				onclick={resetFilters}
				class="text-xs font-cinzel px-3 py-1.5 rounded border border-dark-400 text-parchment/40 hover:text-parchment/70 hover:border-parchment/30"
			>
				Reset
			</button>
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
		<p class="text-parchment/30 text-xs font-cinzel mb-3">{builds.length} build{builds.length !== 1 ? 's' : ''}{hasMore ? '+' : ''}</p>
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
