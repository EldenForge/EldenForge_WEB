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

	let profile = $state<PublicUserProfile | null>(null);
	let builds = $state<PublicBuildListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const pseudo = $derived($page.params.pseudo as string);

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
		<header class="card mb-6">
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
