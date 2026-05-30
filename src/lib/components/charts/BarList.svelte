<script lang="ts">
	interface Item {
		label: string;
		value: number;
		color?: string;
	}

	interface Props {
		items: Item[];
		max?: number;
		format?: (n: number) => string;
		labelWidth?: string;
	}

	let { items, max, format = (n: number) => String(Math.round(n * 10) / 10), labelWidth = '4rem' }: Props = $props();

	let computedMax = $derived(max ?? Math.max(...items.map((i) => i.value), 1));
</script>

<div class="space-y-1.5">
	{#each items as it}
		<div class="flex items-center gap-2 text-xs">
			<span class="text-parchment/60 font-cinzel shrink-0 truncate" style="width:{labelWidth}">{it.label}</span>
			<div class="flex-1 h-2.5 bg-dark-800 rounded overflow-hidden border border-dark-400/40">
				<div
					class="h-full transition-all"
					style="width:{Math.min(100, (it.value / computedMax) * 100).toFixed(1)}%; background:{it.color ?? 'rgb(200 169 81 / 0.8)'};"
				></div>
			</div>
			<span class="text-gold/80 font-cinzel w-10 text-right shrink-0">{format(it.value)}</span>
		</div>
	{/each}
</div>
