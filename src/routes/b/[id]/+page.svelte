<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getPublicBuild, forkBuild, likeBuild, unlikeBuild, deleteBuild, type PublicBuildOut } from '$lib/api/builds';
	import { authStore } from '$lib/stores/auth';
	import { openLoginModal } from '$lib/stores/ui';
	import { ApiError } from '$lib/api/auth';
	import { loadAllItems } from '$lib/api/items';
	import GuideView from '$lib/components/GuideView.svelte';
	import BuildSummary from '$lib/components/BuildSummary.svelte';
	import { deserializeBuild, type BuildPayload } from '$lib/builds/serialize';
	import type { AnyItem } from '$lib/stores/tooltip';

	let build = $state<PublicBuildOut | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let working = $state(false);
	let liked = $state(false);
	let likeCount = $state(0);
	let likePending = $state(false);
	let guideItems = $state<(AnyItem & { id: string })[]>([]);
	let lookups = $state<Awaited<ReturnType<typeof loadAllItems>> | null>(null);

	const id = $derived($page.params.id as string);

	const buildState = $derived(
		build && lookups ? deserializeBuild(build.data as unknown as BuildPayload, lookups) : null
	);

	// Pseudos are unique, so this reliably identifies ownership without depending
	// on the (possibly expired) access-token cookie used by optional auth.
	const isMine = $derived(
		build != null && $authStore.user != null && build.author_pseudo === $authStore.user.pseudo
	);

	async function load() {
		loading = true;
		error = null;
		try {
			build = await getPublicBuild(id);
			liked = build.liked_by_me;
			likeCount = build.like_count;
		} catch (e) {
			if (e instanceof ApiError && e.status === 404) error = 'Build not found';
			else error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	async function toggleLike() {
		if (!$authStore.user) {
			openLoginModal();
			return;
		}
		if (likePending) return;
		likePending = true;
		const wasLiked = liked;
		const origCount = likeCount;
		liked = !wasLiked;
		likeCount = origCount + (liked ? 1 : -1);
		try {
			const res = wasLiked ? await unlikeBuild(id) : await likeBuild(id);
			liked = res.liked;
			likeCount = res.like_count;
		} catch {
			liked = wasLiked;
			likeCount = origCount;
		} finally {
			likePending = false;
		}
	}

	async function handleModify() {
		if (!build) return;
		if (!$authStore.user) {
			openLoginModal();
			return;
		}
		if (isMine) {
			goto(`/build?build=${build.id}`);
			return;
		}
		working = true;
		try {
			const fork = await forkBuild(id);
			goto(`/build?build=${fork.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Action failed';
		} finally {
			working = false;
		}
	}

	let deleting = $state(false);

	async function handleDelete() {
		if (!build || !isMine) return;
		if (!confirm('Delete this build permanently? This cannot be undone.')) return;
		deleting = true;
		try {
			await deleteBuild(id);
			goto('/builds');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Delete failed';
			deleting = false;
		}
	}

	const stats = $derived(build?.data?.stats as Record<string, number> | undefined);
	const guide = $derived(build?.data?.guide as string | undefined);

	onMount(() => {
		load();
		// Load item data so [Item] references in the guide render as chips.
		loadAllItems()
			.then((d) => {
				lookups = d;
				guideItems = [
					...d.weapons, ...d.shields, ...d.armors, ...d.talismans,
					...d.sorceries, ...d.incantations, ...d.spirits
				];
			})
			.catch(() => {});
	});
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
			<button
				type="button"
				onclick={toggleLike}
				disabled={likePending}
				aria-label={liked ? 'Unlike' : 'Like'}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors disabled:opacity-50
					{liked
						? 'border-red-400/50 text-red-400'
						: 'border-gold/25 text-parchment/60 hover:text-red-400/80 hover:border-red-400/30'}"
			>
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/></svg>
				<span class="font-cinzel text-sm">{liked ? 'Liked' : 'Like'}</span>
				<span class="text-sm">{likeCount}</span>
			</button>
			<button class="btn-gold" onclick={handleModify} disabled={working}>
				{working ? '...' : 'Modify'}
			</button>
			{#if isMine}
				<button
					type="button"
					class="btn-reset hover:!text-red-400 hover:!border-red-400/40"
					onclick={handleDelete}
					disabled={deleting}
				>
					{deleting ? '...' : 'Delete'}
				</button>
			{/if}
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

		{#if buildState}
			<section class="card mb-4">
				<h2 class="section-title">Equipment</h2>
				<BuildSummary build={buildState} />
			</section>
		{/if}

		{#if guide}
			<section class="card">
				<h2 class="section-title">Guide</h2>
				<GuideView {guide} allItems={guideItems} />
			</section>
		{/if}
	{/if}
</div>
