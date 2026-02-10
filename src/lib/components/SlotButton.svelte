<script lang="ts">
	interface Props {
		slotLabel: string;
		itemName?: string | null;
		itemImage?: string | null;
		size?: 'sm' | 'md' | 'lg';
		onclick?: () => void;
	}
	let { slotLabel, itemName = null, itemImage = null, size = 'md', onclick }: Props = $props();

	const sizes: Record<string, string> = {
		sm: 'w-14 h-14',
		md: 'w-[72px] h-[72px]',
		lg: 'w-20 h-20'
	};

	let equipped = $derived(!!itemName);
	let imgFailed = $state(false);

	$effect(() => {
		itemImage;
		imgFailed = false;
	});
</script>

<button class="flex flex-col items-center gap-1 group cursor-pointer" type="button" {onclick}>
	<div
		class="{sizes[size]} rounded-lg border-2 overflow-hidden flex items-center justify-center
			transition-all duration-200
			{equipped ? 'border-gold/40 bg-dark-700' : 'border-dark-400/60 bg-dark-800/80'}
			group-hover:border-gold group-hover:shadow-[0_0_15px_rgba(200,169,81,0.2)]"
	>
		{#if equipped && itemImage && !imgFailed}
			<img
				src={itemImage}
				alt={itemName ?? ''}
				class="w-full h-full object-contain p-1"
				onerror={() => {
					imgFailed = true;
				}}
			/>
		{:else if equipped}
			<span
				class="text-gold/60 text-[9px] font-cinzel text-center px-1 leading-tight break-words"
			>
				{itemName}
			</span>
		{:else}
			<svg
				class="w-5 h-5 text-parchment/15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M12 5v14M5 12h14" />
			</svg>
		{/if}
	</div>
	<span
		class="text-[10px] {equipped
			? 'text-gold/50'
			: 'text-parchment/20'} font-cinzel tracking-wider text-center leading-tight max-w-20 truncate"
	>
		{slotLabel}
	</span>
</button>
