<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ItemTooltip from '$lib/components/ItemTooltip.svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import { authStore } from '$lib/stores/auth';
	import { authModalOpen } from '$lib/stores/ui';
	import { BANNERS } from '$lib/art/banners';

	let { children } = $props();
	let bgBanner = $state<string | null>(null);

	onMount(() => {
		authStore.bootstrap();
		// Une image stable pour toute la session (pas par route, pour eviter le flicker)
		const pick = BANNERS[Math.floor(Math.random() * BANNERS.length)];
		bgBanner = pick?.path ?? null;
	});

	function openLogin() {
		authModalOpen.set(true);
	}
	function closeAuthModal() {
		authModalOpen.set(false);
	}
</script>

<!-- Vitrail decoratif : screenshot ER/SOTE flou + vignette sombre pour la lisibilite -->
{#if bgBanner}
	<div class="fixed inset-0 -z-10 pointer-events-none">
		<img
			src={bgBanner}
			alt=""
			aria-hidden="true"
			class="w-full h-full object-cover"
			style="filter: blur(3px);"
		/>
		<div
			class="absolute inset-0"
			style="background: radial-gradient(ellipse at center, rgb(0 0 0 / 0.45) 25%, rgb(20 18 14 / 0.92) 80%);"
		></div>
	</div>
{/if}

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
			Explore
		</a>
		<a
			href="/build"
			class="px-3 py-1 font-cinzel text-xs tracking-wider rounded transition-colors
				{$page.url.pathname === '/build'
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
		<a
			href="/codex"
			class="px-3 py-1 font-cinzel text-xs tracking-wider rounded transition-colors
				{$page.url.pathname.startsWith('/codex')
				? 'text-gold bg-gold/10 border border-gold/30'
				: 'text-parchment/50 hover:text-parchment/80'}"
		>
			Codex
		</a>
		{#if $authStore.user}
			<a
				href="/builds"
				class="px-3 py-1 font-cinzel text-xs tracking-wider rounded transition-colors
					{$page.url.pathname === '/builds'
					? 'text-gold bg-gold/10 border border-gold/30'
					: 'text-parchment/50 hover:text-parchment/80'}"
			>
				My Builds
			</a>
		{/if}
		<div class="flex-1"></div>
		<UserMenu onlogin={openLogin} />
	</div>
</nav>

{@render children()}

<footer class="mt-16 border-t border-gold/10 bg-dark-900/40">
	<div class="max-w-7xl mx-auto px-4 py-4 text-[10px] text-parchment/40 font-cinzel tracking-wider text-center leading-relaxed">
		ELDEN RING™ &amp; Shadow of the Erdtree™ &copy; BANDAI NAMCO Entertainment Inc. / FromSoftware, Inc.
		<br />
		EldenForge is an unofficial fan-made tool. Images used for illustration purposes only.
	</div>
</footer>

<ItemTooltip />

<AuthModal open={$authModalOpen} onclose={closeAuthModal} />
