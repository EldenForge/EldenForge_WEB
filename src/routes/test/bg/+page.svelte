<script lang="ts">
	import { BANNERS, pickBanner } from '$lib/art/banners';

	type Style = 'ambient' | 'vitrail' | 'hero' | 'random' | 'none';
	let style = $state<Style>('ambient');
	let bannerPath = $state(BANNERS[0]?.path ?? '');
	let randomKey = $state(0); // bump pour forcer re-pick en mode random

	function reroll() {
		const idx = Math.floor(Math.random() * BANNERS.length);
		bannerPath = BANNERS[idx]?.path ?? '';
		randomKey++;
	}

	// Initial pick stable par session
	bannerPath = pickBanner(String(Date.now())).path;
</script>

<svelte:head><title>BG Test — Elden Forge</title></svelte:head>

<!-- ── Fond plein ecran selon style ── -->
{#if style === 'ambient' || style === 'random'}
	<div class="fixed inset-0 -z-10 pointer-events-none">
		<img
			src={bannerPath}
			alt=""
			aria-hidden="true"
			class="w-full h-full object-cover"
			style="filter: blur(20px) sepia(0.35) saturate(1.3) hue-rotate(-10deg) brightness(0.85);"
		/>
		<div class="absolute inset-0" style="background: rgb(20 18 14 / 0.78);"></div>
	</div>
{:else if style === 'vitrail'}
	<div class="fixed inset-0 -z-10 pointer-events-none">
		<img
			src={bannerPath}
			alt=""
			aria-hidden="true"
			class="w-full h-full object-cover"
			style="filter: blur(3px);"
		/>
		<div class="absolute inset-0" style="background: radial-gradient(ellipse at center, rgb(0 0 0 / 0.45) 25%, rgb(20 18 14 / 0.92) 80%);"></div>
	</div>
{:else if style === 'hero'}
	<!-- Pas de fond global, juste un hero en haut -->
{/if}

<div class="max-w-5xl mx-auto px-4 py-8">
	<!-- Switcher d'option -->
	<div class="card !p-3 mb-6 sticky top-12 z-20 backdrop-blur-md bg-dark-900/80">
		<p class="text-[10px] uppercase tracking-widest text-gold/50 font-cinzel mb-2">Style preview</p>
		<div class="flex flex-wrap gap-2 items-center">
			{#each [
				{ id: 'ambient', label: 'Ambient blur' },
				{ id: 'vitrail', label: 'Vitrail' },
				{ id: 'hero', label: 'Hero only' },
				{ id: 'random', label: 'Per-route random' },
				{ id: 'none', label: 'No bg (current)' }
			] as opt}
				<button
					type="button"
					onclick={() => (style = opt.id as Style)}
					class="px-3 py-1 text-xs font-cinzel tracking-wider border rounded transition-colors
						{style === opt.id ? 'bg-gold/15 border-gold/50 text-gold' : 'bg-dark-800 border-dark-400 text-parchment/70 hover:border-gold/30'}"
				>{opt.label}</button>
			{/each}
			<div class="flex-1"></div>
			<button
				type="button"
				onclick={reroll}
				class="px-3 py-1 text-xs font-cinzel tracking-wider border border-dashed border-gold/30 hover:border-gold/60 text-gold/60 hover:text-gold rounded transition-colors"
				title="Roll a new banner"
			>Reroll image</button>
		</div>
		<p class="text-[10px] text-parchment/40 font-cinzel tracking-wider mt-2 truncate">
			{bannerPath || '(no banner)'}
		</p>
	</div>

	<!-- Hero only -->
	{#if style === 'hero'}
		<div class="relative h-64 rounded-xl overflow-hidden mb-8 border border-gold/25">
			<img src={bannerPath} alt="" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover" />
			<div class="absolute inset-0" style="background: linear-gradient(to bottom, rgb(0 0 0 / 0.2) 0%, rgb(0 0 0 / 0.5) 60%, rgb(20 18 14 / 0.9) 100%);"></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<h1 class="font-cinzel text-5xl text-gold tracking-[0.25em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">EXPLORE BUILDS</h1>
			</div>
		</div>
	{/if}

	<!-- Contenu mock -->
	{#if style !== 'hero'}
		<header class="text-center mb-8">
			<h1 class="font-cinzel text-4xl text-gold tracking-[0.25em]">EXPLORE BUILDS</h1>
			<p class="text-parchment/40 font-cinzel tracking-[0.2em] text-xs uppercase mt-2">Community creations</p>
		</header>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
		{#each [
			{ name: 'Bleed Samurai', author: 'Tarnished_42', tags: ['Bleed', 'Dex'], likes: 23, intent: 'PvE' },
			{ name: 'Astrologer Glasscannon', author: 'StarCaster', tags: ['Intelligence', 'Sorceries'], likes: 17, intent: 'PvE' },
			{ name: 'Faith Tank', author: 'Goldmask', tags: ['Faith', 'Boss'], likes: 41, intent: 'Coop' },
			{ name: 'Arcane Bleed Cosplay', author: 'Mohg_Lord', tags: ['Arcane', 'Bleed', 'PvP'], likes: 12, intent: 'PvP' },
			{ name: 'Strength Colossal', author: 'BeastClaw', tags: ['Strength', 'End-game'], likes: 8, intent: 'PvE' },
			{ name: 'Status DPS', author: 'PoisonRose', tags: ['Poison', 'Dex'], likes: 15, intent: 'PvE' }
		] as b}
			<div class="card hover:border-gold/40 transition-colors relative pb-7 overflow-hidden">
				<div class="flex items-start justify-between gap-2">
					<h3 class="font-cinzel text-gold text-base truncate">{b.name}</h3>
					<span class="text-xs text-parchment/50">♥ {b.likes}</span>
				</div>
				<p class="text-parchment/40 text-xs mt-1">by {b.author}</p>
				<p class="text-parchment/60 text-sm mt-2 line-clamp-2">
					A short build description that shows how text reads over the chosen background style.
				</p>
				<div class="flex flex-wrap gap-1 mt-3 pr-14">
					{#each b.tags as t}
						<span class="text-[10px] text-gold/70 border border-gold/25 rounded px-1.5 py-0.5">{t}</span>
					{/each}
				</div>
				<div class="absolute bottom-2 right-2">
					<span class="text-[10px] font-cinzel tracking-widest uppercase px-1.5 py-0.5 rounded border border-gold/40 bg-gold/10 text-gold">{b.intent}</span>
				</div>
			</div>
		{/each}
	</div>

	<!-- Bloc 'stats' pour tester la lisibilite sur fond colore -->
	<div class="card mb-8">
		<h2 class="section-title">Statistics sample</h2>
		<div class="grid grid-cols-4 gap-3">
			{#each ['Vigor','Mind','End','Str','Dex','Int','Fai','Arc'] as s, i}
				<div class="flex justify-between text-sm border-b border-dark-500/50 pb-1">
					<span class="text-parchment/50">{s}</span>
					<span class="text-gold font-cinzel">{10 + i * 3}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Texte long pour tester la lisibilite -->
	<div class="card mb-8 prose prose-invert max-w-none">
		<h2 class="section-title">Guide sample</h2>
		<p class="text-parchment/70 text-sm leading-relaxed">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
			labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
			laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
			voluptate velit esse cillum dolore eu fugiat nulla pariatur.
		</p>
		<p class="text-parchment/70 text-sm leading-relaxed mt-3">
			Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
			anim id est laborum. The text should remain comfortable to read even with a background image.
		</p>
	</div>
</div>
