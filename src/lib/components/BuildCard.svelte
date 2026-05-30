<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PublicBuildListItem } from '$lib/api/builds';
	import { likeBuild, unlikeBuild } from '$lib/api/builds';
	import { authStore } from '$lib/stores/auth';
	import { openLoginModal } from '$lib/stores/ui';
	import IntentBadge from './IntentBadge.svelte';

	interface Props { build: PublicBuildListItem; }
	let { build }: Props = $props();

	let liked = $state(build.liked_by_me);
	let count = $state(build.like_count);
	let pending = $state(false);

	async function toggleLike(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!$authStore.user) {
			openLoginModal();
			return;
		}
		if (pending) return;
		pending = true;
		const wasLiked = liked;
		const origCount = count;
		// optimistic update
		liked = !wasLiked;
		count = origCount + (liked ? 1 : -1);
		try {
			const res = wasLiked ? await unlikeBuild(build.id) : await likeBuild(build.id);
			liked = res.liked;
			count = res.like_count;
		} catch {
			liked = wasLiked;
			count = origCount;
		} finally {
			pending = false;
		}
	}
</script>

<a href="/b/{build.id}" class="card block hover:border-gold/40 transition-colors relative pb-7 overflow-hidden">
	{#if build.primary_weapon_image}
		<div
			class="absolute inset-y-0 left-0 w-32 pointer-events-none flex items-center justify-center"
			style="mask-image: linear-gradient(to right, black 10%, transparent 95%); -webkit-mask-image: linear-gradient(to right, black 10%, transparent 95%);"
		>
			<img
				src={build.primary_weapon_image}
				alt=""
				aria-hidden="true"
				class="w-full h-full object-contain object-center opacity-70"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		</div>
	{/if}
	<div class="relative {build.primary_weapon_image ? 'pl-24' : ''}">
	<div class="flex items-start justify-between gap-2">
		<h3 class="font-cinzel text-gold text-base truncate">{build.name}</h3>
		<button
			type="button"
			onclick={toggleLike}
			disabled={pending}
			aria-label={liked ? 'Unlike' : 'Like'}
			class="flex items-center gap-1 text-xs shrink-0 transition-colors disabled:opacity-50
				{liked ? 'text-red-400' : 'text-parchment/50 hover:text-red-400/70'}"
		>
			<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/></svg>
			{count}
		</button>
	</div>
	<p class="text-parchment/40 text-xs mt-1">
		by
		<button
			type="button"
			onclick={(e) => { e.preventDefault(); e.stopPropagation(); goto(`/u/${encodeURIComponent(build.author_pseudo)}`); }}
			class="text-gold/60 hover:text-gold hover:underline transition-colors"
		>
			{build.author_pseudo}
		</button>
	</p>
	{#if build.description}
		<p class="text-parchment/60 text-sm mt-2 line-clamp-2">{build.description}</p>
	{/if}
	{#if build.tags.length}
		<div class="flex flex-wrap gap-1 mt-3 pr-14">
			{#each build.tags as t}
				<span class="text-[10px] text-gold/70 border border-gold/25 rounded px-1.5 py-0.5">{t}</span>
			{/each}
		</div>
	{/if}
	</div>
	<div class="absolute bottom-2 right-2">
		<IntentBadge intent={build.intent ?? 'pve'} />
	</div>
</a>
