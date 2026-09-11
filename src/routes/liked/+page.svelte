<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { listMyLikes, type PublicBuildListItem } from '$lib/api/builds';
	import BuildCard from '$lib/components/BuildCard.svelte';

	const PAGE_SIZE = 30;

	let builds = $state<PublicBuildListItem[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state<string | null>(null);
	let hasMore = $state(false);

	$effect(() => {
		if ($authStore.bootstrapped && !$authStore.user) {
			goto('/');
		}
	});

	async function load(reset = true) {
		if (reset) {
			loading = true;
			builds = [];
		} else {
			loadingMore = true;
		}
		try {
			const page = await listMyLikes(PAGE_SIZE, reset ? 0 : builds.length);
			builds = reset ? page : [...builds, ...page];
			hasMore = page.length === PAGE_SIZE;
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load liked builds';
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	onMount(() => {
		if ($authStore.user) load(true);
	});

	$effect(() => {
		if ($authStore.user && builds.length === 0 && !loading && !error) {
			load(true);
		}
	});
</script>

<svelte:head><title>Elden Forge — Liked Builds</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-10">
	<header class="text-center mb-8">
		<h1 class="font-cinzel text-3xl text-gold tracking-[0.2em]">LIKED BUILDS</h1>
		<div class="flex items-center justify-center gap-3 mt-3">
			<div class="h-px w-16 bg-gradient-to-r from-transparent to-gold/40"></div>
			<span class="text-gold/50 text-xs">&#9829;</span>
			<div class="h-px w-16 bg-gradient-to-l from-transparent to-gold/40"></div>
		</div>
		<p class="text-parchment/40 text-xs mt-3 font-cinzel tracking-widest">Builds you have hearted</p>
	</header>

	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center"><p class="text-red-400">{error}</p></div>
	{:else if builds.length === 0}
		<div class="card text-center space-y-4 py-12">
			<p class="text-parchment/50 italic">You haven't liked any build yet.</p>
			<a href="/" class="btn-gold inline-block">Explore builds</a>
		</div>
	{:else}
		<p class="text-parchment/30 text-xs font-cinzel mb-3">
			{builds.length} build{builds.length !== 1 ? 's' : ''}{hasMore ? '+' : ''}
		</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each builds as build (build.id)}
				<BuildCard {build} />
			{/each}
		</div>
		{#if hasMore}
			<div class="text-center mt-8">
				<button class="btn-reset" onclick={() => load(false)} disabled={loadingMore}>
					{loadingMore ? 'Loading...' : 'Load more'}
				</button>
			</div>
		{/if}
	{/if}
</div>
