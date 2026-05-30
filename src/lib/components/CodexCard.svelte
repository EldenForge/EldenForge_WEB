<script lang="ts">
	interface Props {
		image?: string;
		name: string;
		subtitle?: string;
		badges?: string[];
		description?: string;
	}
	let { image, name, subtitle, badges = [], description }: Props = $props();
</script>

<div class="card flex gap-3">
	{#if image}
		<img
			src={image}
			alt={name}
			class="w-14 h-14 object-contain bg-dark-800 rounded shrink-0"
			loading="lazy"
			onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
		/>
	{/if}
	<div class="min-w-0 flex-1">
		<div class="flex items-start justify-between gap-2">
			<h3 class="font-cinzel text-gold text-sm truncate">{name}</h3>
			{#if badges.length}
				<div class="flex flex-wrap gap-1 shrink-0 justify-end">
					{#each badges as b}
						<span class="text-[10px] text-gold/70 border border-gold/25 rounded px-1.5 py-0.5">{b}</span>
					{/each}
				</div>
			{/if}
		</div>
		{#if subtitle}
			<p class="text-parchment/70 text-xs mt-0.5">{subtitle}</p>
		{/if}
		{#if description}
			<p class="text-parchment/50 text-[11px] mt-1 line-clamp-3">{description}</p>
		{/if}
	</div>
</div>
