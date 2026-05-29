<script lang="ts">
	import type { PublicBuildListItem } from '$lib/api/builds';
	interface Props { build: PublicBuildListItem; }
	let { build }: Props = $props();
</script>

<a href="/b/{build.id}" class="card block hover:border-gold/40 transition-colors">
	<div class="flex items-start justify-between gap-2">
		<h3 class="font-cinzel text-gold text-base truncate">{build.name}</h3>
		<span class="flex items-center gap-1 text-parchment/50 text-xs shrink-0">
			<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/></svg>
			{build.like_count}
		</span>
	</div>
	<p class="text-parchment/40 text-xs mt-1">by {build.author_pseudo}</p>
	{#if build.description}
		<p class="text-parchment/60 text-sm mt-2 line-clamp-2">{build.description}</p>
	{/if}
	{#if build.tags.length}
		<div class="flex flex-wrap gap-1 mt-3">
			{#each build.tags as t}
				<span class="text-[10px] text-gold/70 border border-gold/25 rounded px-1.5 py-0.5">{t}</span>
			{/each}
		</div>
	{/if}
</a>
