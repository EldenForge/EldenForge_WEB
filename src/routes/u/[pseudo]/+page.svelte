<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		fetchPublicUser,
		listPublicBuilds,
		type PublicUserProfile,
		type PublicBuildListItem
	} from '$lib/api/builds';
	import BuildCard from '$lib/components/BuildCard.svelte';
	import { ApiError } from '$lib/api/auth';
	import { pickBanner } from '$lib/art/banners';

	let profile = $state<PublicUserProfile | null>(null);
	let builds = $state<PublicBuildListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const pseudo = $derived($page.params.pseudo as string);
	const banner = $derived(pickBanner(pseudo));

	async function load() {
		loading = true;
		error = null;
		try {
			const [p, b] = await Promise.all([
				fetchPublicUser(pseudo),
				listPublicBuilds({ author: pseudo, limit: 60, sort: 'recent' })
			]);
			profile = p;
			builds = b;
		} catch (e) {
			if (e instanceof ApiError && e.status === 404) error = 'User not found';
			else error = e instanceof Error ? e.message : 'Failed to load profile';
		} finally {
			loading = false;
		}
	}

	function fmtDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
		} catch {
			return iso;
		}
	}

	onMount(load);
</script>

<svelte:head><title>{profile?.pseudo ?? pseudo} — Elden Forge</title></svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center space-y-3">
			<p class="text-red-400">{error}</p>
			<a href="/" class="btn-reset inline-block">Back to explore</a>
		</div>
	{:else if profile}
		<!-- Bannière : screenshot officiel ER/SOTE sélectionné par hash du pseudo -->
		<div class="relative h-40 sm:h-56 rounded-xl overflow-hidden border border-gold/25 mb-6 bg-dark-900">
			<img
				src={banner.path}
				alt=""
				aria-hidden="true"
				class="absolute inset-0 w-full h-full object-cover"
				loading="eager"
			/>
			<!-- Voile sombre pour lisibilité de la carte qui chevauche -->
			<div class="absolute inset-0" style="background: linear-gradient(to bottom, rgb(0 0 0 / 0.15) 0%, rgb(0 0 0 / 0.55) 70%, rgb(20 18 14 / 0.85) 100%);"></div>
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<span class="font-cinzel text-gold/25 text-7xl sm:text-8xl tracking-widest select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
					{profile.pseudo[0]?.toUpperCase() ?? '?'}
				</span>
			</div>
			<!-- Attribution discrète -->
			<a
				href={banner.source}
				target="_blank"
				rel="noopener noreferrer"
				title="{banner.name} — {banner.copyright}"
				class="absolute bottom-1 right-2 text-[9px] text-parchment/40 hover:text-parchment/70 font-cinzel tracking-wider"
			>© BANDAI NAMCO / FromSoftware</a>
		</div>

		<header class="card mb-6 -mt-16 relative">
			<div class="flex items-center justify-between gap-4 flex-wrap">
				<div>
					<h1 class="font-cinzel text-3xl text-gold tracking-wider">{profile.pseudo}</h1>
					<p class="text-parchment/50 text-xs mt-1">Joined {fmtDate(profile.created_at)}</p>
				</div>
				<div class="flex gap-6">
					<div class="text-center">
						<p class="font-cinzel text-gold text-2xl">{profile.builds_count}</p>
						<p class="text-[10px] uppercase tracking-widest text-gold/50 font-cinzel">Public builds</p>
					</div>
					<div class="text-center">
						<p class="font-cinzel text-gold text-2xl">{profile.total_likes_received}</p>
						<p class="text-[10px] uppercase tracking-widest text-gold/50 font-cinzel">Total likes</p>
					</div>
				</div>
			</div>
		</header>

		{#if builds.length === 0}
			<div class="card text-center py-12">
				<p class="text-parchment/50 italic">No public builds yet.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each builds as build (build.id)}
					<BuildCard {build} />
				{/each}
			</div>
		{/if}
	{/if}
</div>
