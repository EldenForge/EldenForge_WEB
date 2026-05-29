<script lang="ts">
	import { type AnyItem } from '$lib/stores/tooltip';
	import GuideView from './GuideView.svelte';

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
				class="min-h-[8rem] bg-dark-800/40 border border-dark-400/40 rounded-lg px-4 py-3"
			>
				<GuideView {guide} {allItems} />
			</div>
		{/if}
	{/if}
</div>
