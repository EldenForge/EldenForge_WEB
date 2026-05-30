<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
	}
	let { title, subtitle }: Props = $props();
</script>

<header class="text-center mb-6">
	<p class="text-parchment/40 text-[11px] font-cinzel tracking-widest uppercase">
		<a href="/codex" class="hover:text-gold/70 transition-colors">Codex</a>
		{#if subtitle}
			<span class="text-parchment/30">/</span> {subtitle}
		{/if}
	</p>
	<h1 class="font-cinzel text-3xl text-gold tracking-[0.2em] mt-2">{title}</h1>
	<div class="flex items-center justify-center gap-3 mt-3">
		<div class="h-px w-16 bg-gradient-to-r from-transparent to-gold/40"></div>
		<span class="text-gold/50 text-xs">&#9670;</span>
		<div class="h-px w-16 bg-gradient-to-l from-transparent to-gold/40"></div>
	</div>
</header>
