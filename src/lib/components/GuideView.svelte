<script lang="ts">
	import { tooltipStore, type AnyItem } from '$lib/stores/tooltip';

	type ItemRef = AnyItem & { id: string };

	interface Props {
		guide: string;
		allItems: ItemRef[];
	}

	let { guide, allItems }: Props = $props();

	let itemMap = $derived(new Map(allItems.map((item) => [item.name.toLowerCase(), item])));

	type Segment =
		| { type: 'text'; content: string }
		| { type: 'item'; content: string; item: ItemRef | undefined };

	function parseGuide(text: string): Segment[] {
		const segments: Segment[] = [];
		const regex = /\[([^\]]+)\]/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
			}
			const itemName = match[1];
			segments.push({ type: 'item', content: itemName, item: itemMap.get(itemName.toLowerCase()) });
			lastIndex = match.index + match[0].length;
		}
		if (lastIndex < text.length) {
			segments.push({ type: 'text', content: text.slice(lastIndex) });
		}
		return segments;
	}

	function textToLines(text: string): string[] {
		return text.split('\n');
	}

	function fextralife(name: string): string {
		return 'https://eldenring.wiki.fextralife.com/' + name.trim().replace(/ /g, '+');
	}
</script>

<div class="text-sm text-parchment/80 leading-relaxed">
	{#each textToLines(guide) as line, li}
		{#if li > 0}<br />{/if}
		{#each parseGuide(line) as seg}
			{#if seg.type === 'text'}
				{seg.content}
			{:else if seg.item}
				<a
					href={fextralife(seg.item.name)}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 bg-dark-700 border border-gold/30
						rounded px-1.5 py-0.5 mx-0.5 align-middle
						hover:border-gold hover:bg-dark-600 transition-colors cursor-pointer"
					onmouseenter={(e) => tooltipStore.show(seg.item!, e.clientX, e.clientY)}
					onmousemove={(e) => tooltipStore.move(e.clientX, e.clientY)}
					onmouseleave={() => tooltipStore.hide()}
				>
					{#if seg.item.image}
						<img
							src={seg.item.image}
							alt={seg.item.name}
							class="w-4 h-4 object-contain rounded shrink-0 bg-dark-900"
							onerror={(e) => {
								(e.currentTarget as HTMLImageElement).style.display = 'none';
							}}
						/>
					{/if}
					<span class="text-gold text-[11px] font-cinzel leading-none">{seg.item.name}</span>
					<svg class="w-2.5 h-2.5 text-gold/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" y1="14" x2="21" y2="3" />
					</svg>
				</a>
			{:else}
				<span class="text-parchment/40">[{seg.content}]</span>
			{/if}
		{/each}
	{/each}
</div>
