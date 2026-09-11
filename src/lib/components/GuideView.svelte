<script lang="ts">
	import { tooltipStore, type AnyItem } from '$lib/stores/tooltip';

	type ItemRef = AnyItem & { id: string };

	interface Props {
		guide: string;
		allItems: ItemRef[];
	}

	let { guide, allItems }: Props = $props();

	let itemMap = $derived(new Map(allItems.map((item) => [item.name.toLowerCase(), item])));

	type InlineSegment =
		| { type: 'text'; content: string }
		| { type: 'bold'; content: string }
		| { type: 'italic'; content: string }
		| { type: 'code'; content: string }
		| { type: 'item'; content: string; item: ItemRef | undefined };

	type Block =
		| { type: 'h2' | 'h3' | 'h4'; content: string }
		| { type: 'li'; content: string }
		| { type: 'p'; content: string }
		| { type: 'gap' };

	function parseInline(text: string): InlineSegment[] {
		const segs: InlineSegment[] = [];
		const patterns: { re: RegExp; type: InlineSegment['type'] }[] = [
			{ re: /\[([^\]]+)\]/g, type: 'item' },
			{ re: /\*\*([^*\n]+)\*\*/g, type: 'bold' },
			{ re: /`([^`\n]+)`/g, type: 'code' },
			{ re: /(?<!\*)\*([^*\n]+)\*(?!\*)/g, type: 'italic' }
		];

		type Match = { start: number; end: number; content: string; type: InlineSegment['type'] };
		const matches: Match[] = [];
		for (const { re, type } of patterns) {
			re.lastIndex = 0;
			let m: RegExpExecArray | null;
			while ((m = re.exec(text)) !== null) {
				matches.push({ start: m.index, end: m.index + m[0].length, content: m[1], type });
			}
		}
		matches.sort((a, b) => a.start - b.start || b.end - a.end);
		const kept: Match[] = [];
		let cursor = 0;
		for (const m of matches) {
			if (m.start < cursor) continue;
			kept.push(m);
			cursor = m.end;
		}

		let last = 0;
		for (const m of kept) {
			if (m.start > last) segs.push({ type: 'text', content: text.slice(last, m.start) });
			if (m.type === 'item') {
				segs.push({ type: 'item', content: m.content, item: itemMap.get(m.content.toLowerCase()) });
			} else {
				segs.push({ type: m.type, content: m.content });
			}
			last = m.end;
		}
		if (last < text.length) segs.push({ type: 'text', content: text.slice(last) });
		return segs;
	}

	function parseBlocks(text: string): Block[] {
		const blocks: Block[] = [];
		const lines = text.split('\n');
		for (const raw of lines) {
			const line = raw.trimEnd();
			if (line.trim() === '') {
				if (blocks.length && blocks[blocks.length - 1].type !== 'gap') {
					blocks.push({ type: 'gap' });
				}
				continue;
			}
			let m = /^(#{2,4})\s+(.*)$/.exec(line);
			if (m) {
				const level = m[1].length;
				const t = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
				blocks.push({ type: t, content: m[2].replace(/:\s*$/, '') });
				continue;
			}
			m = /^\s*[-*]\s+(.*)$/.exec(line);
			if (m) {
				blocks.push({ type: 'li', content: m[1] });
				continue;
			}
			blocks.push({ type: 'p', content: line });
		}
		if (blocks.length && blocks[blocks.length - 1].type === 'gap') blocks.pop();
		return blocks;
	}

	let blocks = $derived(parseBlocks(guide));

	function fextralife(name: string): string {
		return 'https://eldenring.wiki.fextralife.com/' + name.trim().replace(/ /g, '+');
	}
</script>

<div class="guide-view text-sm text-parchment/80 leading-relaxed space-y-1">
	{#each blocks as block}
		{#if block.type === 'gap'}
			<div class="h-2"></div>
		{:else if block.type === 'h2'}
			<h3 class="font-cinzel text-gold text-base mt-3 mb-1">
				{#each parseInline(block.content) as seg}{@render inline(seg)}{/each}
			</h3>
		{:else if block.type === 'h3'}
			<h4 class="font-cinzel text-gold/90 text-sm mt-2 mb-1">
				{#each parseInline(block.content) as seg}{@render inline(seg)}{/each}
			</h4>
		{:else if block.type === 'h4'}
			<h5 class="font-cinzel text-gold/80 text-sm mt-1">
				{#each parseInline(block.content) as seg}{@render inline(seg)}{/each}
			</h5>
		{:else if block.type === 'li'}
			<div class="flex gap-2 pl-2">
				<span class="text-gold/60 shrink-0">•</span>
				<div class="flex-1">
					{#each parseInline(block.content) as seg}{@render inline(seg)}{/each}
				</div>
			</div>
		{:else}
			<p>
				{#each parseInline(block.content) as seg}{@render inline(seg)}{/each}
			</p>
		{/if}
	{/each}
</div>

{#snippet inline(seg: InlineSegment)}
	{#if seg.type === 'text'}
		{seg.content}
	{:else if seg.type === 'bold'}
		<strong class="text-parchment font-semibold">{seg.content}</strong>
	{:else if seg.type === 'italic'}
		<em>{seg.content}</em>
	{:else if seg.type === 'code'}
		<code class="bg-dark-800 text-gold/90 px-1 rounded text-xs">{seg.content}</code>
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
{/snippet}
