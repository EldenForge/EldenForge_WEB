<script lang="ts">
	import SlotButton from './SlotButton.svelte';
	import type { Spell, Spirit } from '$lib/types';

	interface Props {
		spells: (Spell | null)[];
		spirit: Spirit | null;
		onspellclick: (index: number) => void;
		onspiritclick: () => void;
	}
	let { spells, spirit, onspellclick, onspiritclick }: Props = $props();
</script>

<!-- Spell Slots -->
<div class="grid grid-cols-5 gap-2 justify-items-center max-w-sm mx-auto">
	{#each spells as spell, i}
		<SlotButton
			slotLabel="Spell {i + 1}"
			itemName={spell?.name}
			itemImage={spell?.image}
			itemData={spell}
			size="sm"
			onclick={() => onspellclick(i)}
		/>
	{/each}
</div>

<!-- Spirit Ashes -->
<div class="flex justify-center mt-6">
	<SlotButton
		slotLabel="Spirit Ashes"
		itemName={spirit?.name}
		itemImage={spirit?.image}
		itemData={spirit}
		size="md"
		onclick={onspiritclick}
	/>
</div>
