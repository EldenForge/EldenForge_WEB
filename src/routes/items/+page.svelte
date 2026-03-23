<script lang="ts">
	import { onMount } from 'svelte';
	import { loadAllItems } from '$lib/api/items';
	import { tooltipStore, type AnyItem } from '$lib/stores/tooltip';
	import type { Armor, Weapon, Talisman, Sorcery, Incantation, Spirit } from '$lib/types';

	// ── Data ──
	let loading = $state(true);
	let error = $state('');

	let weapons = $state<Weapon[]>([]);
	let shields = $state<Weapon[]>([]);
	let armors = $state<Armor[]>([]);
	let talismans = $state<Talisman[]>([]);
	let sorceries = $state<Sorcery[]>([]);
	let incantations = $state<Incantation[]>([]);
	let spirits = $state<Spirit[]>([]);

	// ── Filters ──
	type ItemType =
		| 'all'
		| 'weapons'
		| 'shields'
		| 'armor'
		| 'talismans'
		| 'sorceries'
		| 'incantations'
		| 'spirits';

	let activeType = $state<ItemType>('all');
	let search = $state('');
	let subFilter = $state('');

	const tabs: { id: ItemType; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'weapons', label: 'Weapons' },
		{ id: 'shields', label: 'Shields' },
		{ id: 'armor', label: 'Armor' },
		{ id: 'talismans', label: 'Talismans' },
		{ id: 'sorceries', label: 'Sorceries' },
		{ id: 'incantations', label: 'Incantations' },
		{ id: 'spirits', label: 'Spirits' }
	];

	// Sub-category options per type
	let subOptions = $derived.by((): string[] => {
		if (activeType === 'weapons') return [...new Set(weapons.map((w) => w.category))].sort();
		if (activeType === 'armor')
			return [...new Set(armors.map((a) => a.category))].sort();
		return [];
	});

	// ── Pagination ──
	const PAGE_SIZE = 48;
	let currentPage = $state(1);

	// Reset page when any filter changes
	$effect(() => {
		activeType; search; subFilter;
		currentPage = 1;
	});

	// ── Unified item list ──
	type TypedItem = AnyItem & { _type: string } & Record<string, unknown>;

	let allItems = $derived.by((): TypedItem[] => {
		const tag = <T extends AnyItem>(items: T[], type: string): TypedItem[] =>
			items.map((i) => ({ ...i, _type: type } as TypedItem));

		switch (activeType) {
			case 'weapons':
				return tag(weapons, 'weapon');
			case 'shields':
				return tag(shields, 'shield');
			case 'armor':
				return tag(armors, 'armor');
			case 'talismans':
				return tag(talismans, 'talisman');
			case 'sorceries':
				return tag(sorceries, 'sorcery');
			case 'incantations':
				return tag(incantations, 'incantation');
			case 'spirits':
				return tag(spirits, 'spirit');
			default:
				return [
					...tag(weapons, 'weapon'),
					...tag(shields, 'shield'),
					...tag(armors, 'armor'),
					...tag(talismans, 'talisman'),
					...tag(sorceries, 'sorcery'),
					...tag(incantations, 'incantation'),
					...tag(spirits, 'spirit')
				];
		}
	});

	let filtered = $derived.by(() => {
		let list = allItems;

		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter((i) => i.name.toLowerCase().includes(q));
		}

		if (subFilter) {
			list = list.filter((i) => (i.category as string | undefined) === subFilter);
		}

		return list.sort((a, b) => a.name.localeCompare(b.name));
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	let paginated = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

	// Page numbers to show (always first, last, current ±1, with ellipsis)
	let pageNumbers = $derived.by(() => {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
		const pages: (number | '…')[] = [];
		const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
		add(1);
		if (currentPage > 3) pages.push('…');
		for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) add(p);
		if (currentPage < totalPages - 2) pages.push('…');
		add(totalPages);
		return pages;
	});

	// ── Counts ──
	let counts = $derived({
		all:
			weapons.length +
			shields.length +
			armors.length +
			talismans.length +
			sorceries.length +
			incantations.length +
			spirits.length,
		weapons: weapons.length,
		shields: shields.length,
		armor: armors.length,
		talismans: talismans.length,
		sorceries: sorceries.length,
		incantations: incantations.length,
		spirits: spirits.length
	});

	// ── Type badge color ──
	const typeColor: Record<string, string> = {
		weapon: 'text-orange-400 bg-orange-400/10',
		shield: 'text-yellow-500 bg-yellow-500/10',
		armor: 'text-blue-400 bg-blue-400/10',
		talisman: 'text-emerald-400 bg-emerald-400/10',
		sorcery: 'text-purple-400 bg-purple-400/10',
		incantation: 'text-amber-400 bg-amber-400/10',
		spirit: 'text-cyan-400 bg-cyan-400/10'
	};

	// ── Fextralife link ──
	function fextralife(name: string) {
		return `https://eldenring.wiki.fextralife.com/${encodeURIComponent(name.replaceAll(' ', '+'))}`;
	}

	// ── Lifecycle ──
	onMount(async () => {
		try {
			const data = await loadAllItems();
			weapons = data.weapons;
			shields = data.shields;
			armors = data.armors;
			talismans = data.talismans;
			sorceries = data.sorceries;
			incantations = data.incantations;
			spirits = data.spirits;
		} catch (e) {
			error = 'Failed to load data. Make sure the API is running.';
			console.error(e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Elden Forge — Item Database</title>
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
	<header class="text-center pt-10 pb-6">
		<h1 class="font-cinzel text-4xl text-gold tracking-[0.25em] font-semibold">ITEM DATABASE</h1>
		<div class="flex items-center justify-center gap-3 mt-3 mb-2">
			<div class="h-px w-20 bg-gradient-to-r from-transparent to-gold/40"></div>
			<span class="text-gold/50 text-xs">&#9670;</span>
			<div class="h-px w-20 bg-gradient-to-l from-transparent to-gold/40"></div>
		</div>
		<p class="text-parchment/40 font-cinzel tracking-[0.3em] text-xs uppercase">
			{counts.all} items
		</p>
	</header>

	<main class="max-w-7xl mx-auto px-4 pb-12">
		<!-- Search -->
		<div class="mb-4">
			<input
				type="text"
				placeholder="Search items..."
				bind:value={search}
				class="w-full bg-dark-800 border border-dark-400/60 rounded-lg px-4 py-2.5
					text-parchment placeholder-parchment/25 text-sm outline-none
					focus:border-gold/40 transition-colors"
			/>
		</div>

		<!-- Type tabs -->
		<div class="flex gap-1.5 flex-wrap mb-4">
			{#each tabs as tab}
				<button
					type="button"
					onclick={() => (activeType = tab.id)}
					class="px-3 py-1.5 rounded font-cinzel text-xs tracking-wider transition-colors
						{activeType === tab.id
						? 'bg-gold/15 border border-gold/40 text-gold'
						: 'bg-dark-800 border border-dark-400/40 text-parchment/50 hover:text-parchment/80 hover:border-dark-400/60'}"
				>
					{tab.label}
					<span
						class="ml-1 text-[10px] {activeType === tab.id
							? 'text-gold/60'
							: 'text-parchment/25'}"
					>
						{counts[tab.id]}
					</span>
				</button>
			{/each}
		</div>

		<!-- Sub-category filter -->
		{#if subOptions.length > 0}
			<div class="flex gap-1.5 flex-wrap mb-5">
				<button
					type="button"
					onclick={() => (subFilter = '')}
					class="px-2.5 py-1 rounded text-xs transition-colors
						{subFilter === ''
						? 'bg-dark-600 border border-dark-300/50 text-parchment/80'
						: 'border border-dark-400/30 text-parchment/35 hover:text-parchment/60'}"
				>
					All
				</button>
				{#each subOptions as opt}
					<button
						type="button"
						onclick={() => (subFilter = opt)}
						class="px-2.5 py-1 rounded text-xs transition-colors
							{subFilter === opt
							? 'bg-dark-600 border border-dark-300/50 text-parchment/80'
							: 'border border-dark-400/30 text-parchment/35 hover:text-parchment/60'}"
					>
						{opt}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Results count -->
		<p class="text-parchment/30 text-xs mb-4">
			{filtered.length} result{filtered.length !== 1 ? 's' : ''}
			{search ? `for "${search}"` : ''}
			{#if totalPages > 1}
				· page {currentPage}/{totalPages}
			{/if}
		</p>

		<!-- Grid -->
		{#if filtered.length === 0}
			<div class="text-center py-20">
				<p class="text-parchment/30 font-cinzel text-lg">No items found</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
				{#each paginated as item (item.id as string)}
					<a
						href={fextralife(item.name)}
						target="_blank"
						rel="noopener noreferrer"
						class="bg-dark-800 border border-dark-400/40 rounded-lg p-3 flex gap-3
							hover:border-gold/30 hover:bg-dark-700 transition-colors group"
						onmouseenter={(e) => tooltipStore.show(item, e.clientX, e.clientY)}
						onmousemove={(e) => tooltipStore.move(e.clientX, e.clientY)}
						onmouseleave={() => tooltipStore.hide()}
					>
						<!-- Image -->
						<div class="w-14 h-14 shrink-0 bg-dark-900 rounded flex items-center justify-center">
							{#if item.image}
								<img
									src={item.image as string}
									alt={item.name}
									class="w-12 h-12 object-contain"
									onerror={(e) => {
										(e.currentTarget as HTMLImageElement).style.display = 'none';
									}}
								/>
							{/if}
						</div>

						<!-- Info -->
						<div class="min-w-0 flex-1">
							<p
								class="font-cinzel text-parchment/90 text-sm leading-tight group-hover:text-gold transition-colors truncate"
							>
								{item.name}
							</p>

							<!-- Type + category badge -->
							<div class="flex items-center gap-1.5 mt-1 flex-wrap">
								{#if activeType === 'all'}
									<span
										class="text-[10px] px-1.5 py-0.5 rounded {typeColor[item._type] ??
											'text-parchment/40 bg-dark-600'} capitalize"
									>
										{item._type}
									</span>
								{/if}
								{#if item.category}
									<span class="text-[10px] text-parchment/35">{item.category as string}</span>
								{/if}
							</div>

							<!-- Key stats preview -->
							<div class="mt-1.5 text-[10px] text-parchment/45 space-y-0.5">
								{#if item._type === 'weapon' || item._type === 'shield'}
									{@const phys = (item.attack as { name: string; amount: number }[])?.find(
										(a) => a.name === 'Phy'
									)}
									{#if phys && phys.amount > 0}
										<span>Attack {phys.amount}</span>
									{/if}
									{#if item.weight}
										<span class="ml-2">· {item.weight as number} wt</span>
									{/if}
								{:else if item._type === 'armor'}
									{@const phys = (item.dmgNegation as { name: string; amount: number }[])?.find(
										(n) => n.name === 'Phy'
									)}
									{#if phys}
										<span>Negation {phys.amount}</span>
									{/if}
									{#if item.weight}
										<span class="ml-2">· {item.weight as number} wt</span>
									{/if}
								{:else if item._type === 'talisman'}
									<span class="line-clamp-2 leading-relaxed">{item.effect as string}</span>
								{:else if item._type === 'sorcery' || item._type === 'incantation'}
									<span>FP {item.cost as number} · {item.slots as number} slot{(item.slots as number) > 1 ? 's' : ''}</span>
								{:else if item._type === 'spirit'}
									<span>
										FP {item.fpCost as number}
										{(item.hpCost as number) > 0 ? `· HP ${item.hpCost as number}` : ''}
									</span>
								{/if}
							</div>
						</div>
					</a>
				{/each}
			</div>

			<!-- Pagination controls -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center gap-1.5 mt-8">
					<!-- Prev -->
					<button
						type="button"
						onclick={() => { currentPage = Math.max(1, currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
						disabled={currentPage === 1}
						class="px-3 py-1.5 rounded border text-xs font-cinzel transition-colors
							{currentPage === 1
							? 'border-dark-400/20 text-parchment/20 cursor-not-allowed'
							: 'border-dark-400/50 text-parchment/60 hover:border-gold/30 hover:text-parchment/90'}"
					>
						&#8592;
					</button>

					<!-- Page numbers -->
					{#each pageNumbers as p}
						{#if p === '…'}
							<span class="px-2 text-parchment/25 text-xs select-none">…</span>
						{:else}
							<button
								type="button"
								onclick={() => { currentPage = p as number; window.scrollTo({ top: 0, behavior: 'smooth' }); }}
								class="w-8 h-8 rounded border text-xs font-cinzel transition-colors
									{currentPage === p
									? 'border-gold/40 bg-gold/10 text-gold'
									: 'border-dark-400/40 text-parchment/50 hover:border-gold/25 hover:text-parchment/80'}"
							>
								{p}
							</button>
						{/if}
					{/each}

					<!-- Next -->
					<button
						type="button"
						onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
						disabled={currentPage === totalPages}
						class="px-3 py-1.5 rounded border text-xs font-cinzel transition-colors
							{currentPage === totalPages
							? 'border-dark-400/20 text-parchment/20 cursor-not-allowed'
							: 'border-dark-400/50 text-parchment/60 hover:border-gold/30 hover:text-parchment/90'}"
					>
						&#8594;
					</button>
				</div>
			{/if}
		{/if}
	</main>
{/if}
