<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getPublicBuild, forkBuild, type PublicBuildOut } from '$lib/api/builds';
	import { authStore } from '$lib/stores/auth';
	import { ApiError } from '$lib/api/auth';

	let build = $state<PublicBuildOut | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let forking = $state(false);

	const id = $derived($page.params.id as string);

	async function load() {
		loading = true;
		error = null;
		try {
			build = await getPublicBuild(id);
		} catch (e) {
			if (e instanceof ApiError && e.status === 404) error = 'Build not found';
			else error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	async function handleFork() {
		if (!$authStore.user) {
			error = 'Log in to copy this build';
			return;
		}
		forking = true;
		try {
			const fork = await forkBuild(id);
			goto(`/build?build=${fork.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fork failed';
		} finally {
			forking = false;
		}
	}

	const stats = $derived(build?.data?.stats as Record<string, number> | undefined);
	const guide = $derived(build?.data?.guide as string | undefined);

	onMount(load);
</script>

<svelte:head><title>{build ? `${build.name} — Elden Forge` : 'Build — Elden Forge'}</title></svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center space-y-3">
			<p class="text-red-400">{error}</p>
			<a href="/" class="btn-reset inline-block">Back to explore</a>
		</div>
	{:else if build}
		<header class="mb-6">
			<h1 class="font-cinzel text-3xl text-gold tracking-wider">{build.name}</h1>
			<p class="text-parchment/50 text-sm mt-1">by {build.author_pseudo}</p>
			{#if build.forked_from}
				<p class="text-parchment/30 text-xs mt-1 italic">
					Forked from
					<a href="/b/{build.forked_from.id}" class="text-gold/60 hover:text-gold underline">
						{build.forked_from.name}
					</a>
					by {build.forked_from.author_pseudo}
				</p>
			{/if}
			{#if build.tags.length}
				<div class="flex flex-wrap gap-1 mt-3">
					{#each build.tags as t}
						<span class="text-xs text-gold/70 border border-gold/25 rounded px-2 py-0.5">{t}</span>
					{/each}
				</div>
			{/if}
		</header>

		<div class="flex items-center gap-3 mb-6">
			<span class="text-parchment/50 text-sm">&#10084; {build.like_count}</span>
			<button class="btn-gold" onclick={handleFork} disabled={forking}>
				{forking ? '...' : 'Copy to my builds'}
			</button>
		</div>

		{#if build.description}
			<section class="card mb-4">
				<h2 class="section-title">Description</h2>
				<p class="text-parchment/80 text-sm whitespace-pre-wrap">{build.description}</p>
			</section>
		{/if}

		{#if stats}
			<section class="card mb-4">
				<h2 class="section-title">Stats</h2>
				<div class="grid grid-cols-4 gap-2">
					{#each Object.entries(stats) as [k, v]}
						<div class="flex justify-between text-sm">
							<span class="text-parchment/50 capitalize">{k.slice(0, 3)}</span>
							<span class="text-parchment font-cinzel">{v}</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if guide}
			<section class="card">
				<h2 class="section-title">Guide</h2>
				<p class="text-parchment/80 text-sm whitespace-pre-wrap">{guide}</p>
			</section>
		{/if}
	{/if}
</div>
