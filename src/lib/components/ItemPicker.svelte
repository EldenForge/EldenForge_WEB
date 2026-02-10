<script lang="ts">
	interface PickerItem {
		id: string;
		name: string;
		image?: string | null;
		[key: string]: unknown;
	}

	interface Props {
		open: boolean;
		title: string;
		items: PickerItem[];
		selectedId?: string | null;
		onselect: (item: PickerItem) => void;
		onclear: () => void;
		onclose: () => void;
	}

	let { open, title, items, selectedId = null, onselect, onclear, onclose }: Props = $props();
	let search = $state('');
	let searchEl: HTMLInputElement | undefined = $state();

	let filtered = $derived(
		search
			? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
			: items
	);

	$effect(() => {
		if (open) {
			search = '';
			setTimeout(() => searchEl?.focus(), 100);
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Overlay -->
		<div
			class="absolute inset-0 bg-black/70 backdrop-blur-sm"
			role="button"
			tabindex="-1"
			onclick={onclose}
			onkeydown={(e) => e.key === 'Enter' && onclose()}
		></div>

		<!-- Modal -->
		<div
			class="relative bg-dark-700 border border-gold/30 rounded-xl w-full max-w-2xl
				max-h-[80vh] flex flex-col shadow-2xl shadow-black/50"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-dark-400">
				<h3 class="font-cinzel text-gold tracking-wider text-lg">{title}</h3>
				<button
					type="button"
					onclick={onclose}
					class="text-parchment/40 hover:text-parchment text-xl leading-none cursor-pointer"
				>
					&times;
				</button>
			</div>

			<!-- Search + Clear -->
			<div class="px-5 pt-4 pb-2 space-y-2">
				<input
					bind:this={searchEl}
					type="text"
					placeholder="Search..."
					bind:value={search}
					class="w-full bg-dark-800 border border-dark-400 text-parchment rounded-lg px-3 py-2
						text-sm placeholder:text-parchment/30 focus:outline-none focus:border-gold
						focus:ring-1 focus:ring-gold/50"
				/>
				{#if selectedId}
					<button
						type="button"
						onclick={onclear}
						class="text-xs text-parchment/40 hover:text-red-400 transition-colors cursor-pointer"
					>
						&#10005; Unequip current item
					</button>
				{/if}
			</div>

			<!-- Items grid -->
			<div class="flex-1 overflow-y-auto px-5 pb-5 pt-2">
				{#if filtered.length === 0}
					<p class="text-center text-parchment/30 text-sm py-12 font-cinzel">
						No items found
					</p>
				{:else}
					<div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
						{#each filtered as item (item.id)}
							<button
								type="button"
								class="flex flex-col items-center p-2 rounded-lg border transition-all cursor-pointer
									{item.id === selectedId
									? 'border-gold bg-gold/10'
									: 'border-transparent hover:border-gold/30 hover:bg-dark-600'}"
								onclick={() => onselect(item)}
							>
								<div
									class="w-12 h-12 sm:w-14 sm:h-14 mb-1 flex items-center justify-center"
								>
									{#if item.image}
										<img
											src={item.image}
											alt={item.name}
											class="w-full h-full object-contain"
											onerror={(e) => {
												(e.currentTarget as HTMLImageElement).style.display = 'none';
											}}
										/>
									{:else}
										<div
											class="w-full h-full rounded bg-dark-800 flex items-center justify-center"
										>
											<span class="text-parchment/20 text-lg">?</span>
										</div>
									{/if}
								</div>
								<span
									class="text-[10px] text-parchment/70 text-center leading-tight line-clamp-2 w-full"
								>
									{item.name}
								</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
