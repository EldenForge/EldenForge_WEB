<script>
	import '../app.css';
	import { page } from '$app/stores';
	import ItemTooltip from '$lib/components/ItemTooltip.svelte';
	let { children } = $props();
</script>

<nav class="sticky top-0 z-40 bg-dark-900/95 backdrop-blur border-b border-gold/15">
	<div class="max-w-7xl mx-auto px-4 flex items-center gap-1 h-11">
		<span class="font-cinzel text-gold text-sm tracking-[0.2em] mr-4 shrink-0">ELDEN FORGE</span>
		<div class="h-4 w-px bg-gold/20 mr-3"></div>
		<a
			href="/"
			class="px-3 py-1 font-cinzel text-xs tracking-wider rounded transition-colors
				{$page.url.pathname === '/'
				? 'text-gold bg-gold/10 border border-gold/30'
				: 'text-parchment/50 hover:text-parchment/80'}"
		>
			Build
		</a>
		<a
			href="/map"
			class="px-3 py-1 font-cinzel text-xs tracking-wider rounded transition-colors
				{$page.url.pathname === '/map'
				? 'text-gold bg-gold/10 border border-gold/30'
				: 'text-parchment/50 hover:text-parchment/80'}"
		>
			Map
		</a>
	</div>
</nav>

{@render children()}

<ItemTooltip />
