<script lang="ts">
	import { tooltipStore, type AnyItem } from '$lib/stores/tooltip';

	type ItemRef = AnyItem & { id: string };

	interface Props {
		guide: string;
		allItems: ItemRef[];
		onchange: (text: string) => void;
	}

	let { guide, allItems, onchange }: Props = $props();

	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let activeTab = $state<'edit' | 'preview'>('edit');
	let showAutocomplete = $state(false);
	let autocompleteQuery = $state('');
	let autocompleteIndex = $state(0);
	let bracketStart = $state(-1);

	// Fast lookup map: lowercase name → item
	let itemMap = $derived(new Map(allItems.map((item) => [item.name.toLowerCase(), item])));

	// Filtered autocomplete suggestions (max 8)
	let suggestions = $derived(
		autocompleteQuery.length === 0
			? allItems.slice(0, 8)
			: allItems
					.filter((item) =>
						item.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
					)
					.slice(0, 8)
	);

	// Parse guide text into segments for rendering
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
			segments.push({
				type: 'item',
				content: itemName,
				item: itemMap.get(itemName.toLowerCase())
			});
			lastIndex = match.index + match[0].length;
		}
		if (lastIndex < text.length) {
			segments.push({ type: 'text', content: text.slice(lastIndex) });
		}
		return segments;
	}

	let parsed = $derived(parseGuide(guide));

	function handleInput(e: Event) {
		const ta = e.target as HTMLTextAreaElement;
		onchange(ta.value);
		checkAutocomplete(ta);
	}

	function checkAutocomplete(ta: HTMLTextAreaElement) {
		const pos = ta.selectionStart;
		const textBefore = ta.value.slice(0, pos);
		const lastOpen = textBefore.lastIndexOf('[');
		const lastClose = textBefore.lastIndexOf(']');

		if (lastOpen > lastClose) {
			bracketStart = lastOpen;
			autocompleteQuery = textBefore.slice(lastOpen + 1);
			showAutocomplete = true;
			autocompleteIndex = 0;
		} else {
			showAutocomplete = false;
		}
	}

	function selectSuggestion(item: ItemRef) {
		if (!textareaEl) return;
		const pos = textareaEl.selectionStart;
		const before = guide.slice(0, bracketStart);
		const after = guide.slice(pos);
		const newText = before + '[' + item.name + ']' + after;
		onchange(newText);
		showAutocomplete = false;
		const newPos = before.length + item.name.length + 2;
		setTimeout(() => {
			textareaEl?.focus();
			textareaEl?.setSelectionRange(newPos, newPos);
		}, 0);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!showAutocomplete || suggestions.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			autocompleteIndex = Math.min(autocompleteIndex + 1, suggestions.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			autocompleteIndex = Math.max(autocompleteIndex - 1, 0);
		} else if (e.key === 'Enter' || e.key === 'Tab') {
			if (suggestions[autocompleteIndex]) {
				e.preventDefault();
				selectSuggestion(suggestions[autocompleteIndex]);
			}
		} else if (e.key === 'Escape') {
			showAutocomplete = false;
		}
	}

	// Render plain text preserving line breaks
	function textToLines(text: string): string[] {
		return text.split('\n');
	}

	function fextralife(name: string): string {
		return 'https://eldenring.wiki.fextralife.com/' + name.trim().replace(/ /g, '+');
	}
</script>

<div class="space-y-3">
	<!-- Tab bar -->
	<div class="flex gap-1 border-b border-dark-400/40 pb-0">
		<button
			type="button"
			class="px-3 py-1.5 text-xs font-cinzel tracking-wider transition-colors
				{activeTab === 'edit'
				? 'text-gold border-b-2 border-gold -mb-px'
				: 'text-parchment/40 hover:text-parchment/70'}"
			onclick={() => (activeTab = 'edit')}
		>
			Edit
		</button>
		<button
			type="button"
			class="px-3 py-1.5 text-xs font-cinzel tracking-wider transition-colors
				{activeTab === 'preview'
				? 'text-gold border-b-2 border-gold -mb-px'
				: 'text-parchment/40 hover:text-parchment/70'}"
			onclick={() => (activeTab = 'preview')}
		>
			Preview
		</button>
	</div>

	<!-- Edit tab -->
	{#if activeTab === 'edit'}
		<div class="relative">
			<textarea
				bind:this={textareaEl}
				value={guide}
				oninput={handleInput}
				onkeydown={handleKeydown}
				onblur={() => setTimeout(() => (showAutocomplete = false), 150)}
				rows={6}
				placeholder="Write your build guide here...&#10;Use [Item Name] to reference items (e.g. [Moonveil], [Radagon's Soreseal])"
				class="w-full bg-dark-800 border border-dark-400/60 rounded-lg px-3 py-2.5 text-parchment/80
					text-sm resize-y leading-relaxed placeholder:text-parchment/20
					focus:outline-none focus:border-gold/50 focus:bg-dark-700/80 transition-colors font-sans"
			></textarea>

			<!-- Autocomplete dropdown -->
			{#if showAutocomplete && suggestions.length > 0}
				<div
					class="absolute left-0 right-0 bottom-full mb-1 z-50
						bg-dark-800 border border-gold/30 rounded-lg overflow-hidden shadow-xl"
				>
					{#each suggestions as item, i}
						<button
							type="button"
							class="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors
								{i === autocompleteIndex
								? 'bg-gold/15 text-parchment'
								: 'text-parchment/70 hover:bg-dark-700/60'}"
							onmousedown={() => selectSuggestion(item)}
						>
							{#if item.image}
								<img
									src={item.image}
									alt={item.name}
									class="w-6 h-6 object-contain rounded shrink-0 bg-dark-900"
									onerror={(e) => {
										(e.currentTarget as HTMLImageElement).style.display = 'none';
									}}
								/>
							{:else}
								<div class="w-6 h-6 rounded bg-dark-900 shrink-0"></div>
							{/if}
							<span class="text-xs font-cinzel truncate">{item.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<p class="text-parchment/25 text-[11px]">
			Type <span class="text-gold/50 font-mono">[</span> to reference an item — use arrow keys to
			navigate, Enter to insert
		</p>
	{/if}

	<!-- Preview tab -->
	{#if activeTab === 'preview'}
		{#if guide.trim() === ''}
			<p class="text-parchment/25 text-sm italic text-center py-6 font-cinzel">
				No guide written yet
			</p>
		{:else}
			<div
				class="min-h-[8rem] bg-dark-800/40 border border-dark-400/40 rounded-lg px-4 py-3
					text-sm text-parchment/80 leading-relaxed"
			>
				{#each textToLines(guide) as line, li}
					{#if li > 0}<br />{/if}
					{#each parseGuide(line) as seg}
						{#if seg.type === 'text'}
							{seg.content}
						{:else if seg.item}
							<!-- Known item chip — links to Fextralife wiki -->
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
							<!-- Unknown item — show as plain bracketed text -->
							<span class="text-parchment/40">[{seg.content}]</span>
						{/if}
					{/each}
				{/each}
			</div>
		{/if}
	{/if}
</div>
