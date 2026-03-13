<script lang="ts">
	import SlotButton from './SlotButton.svelte';
	import type { Armor, Talisman, Weapon } from '$lib/types';

	interface Props {
		armor: { head: Armor | null; chest: Armor | null; hands: Armor | null; legs: Armor | null };
		weapons: { right: Weapon | null; left: Weapon | null };
		talismans: (Talisman | null)[];
		onslotclick: (category: string, slot: string) => void;
	}
	let { armor, weapons, talismans, onslotclick }: Props = $props();
</script>

<!-- Armor + Weapons Grid -->
<div class="grid grid-cols-3 gap-3 justify-items-center max-w-xs mx-auto">
	<div class="col-start-2 row-start-1">
		<SlotButton
			slotLabel="Head"
			itemName={armor.head?.name}
			itemImage={armor.head?.image}
			itemData={armor.head}
			size="lg"
			onclick={() => onslotclick('armor', 'head')}
		/>
	</div>
	<div class="col-start-1 row-start-2">
		<SlotButton
			slotLabel="Left Hand"
			itemName={weapons.left?.name}
			itemImage={weapons.left?.image}
			itemData={weapons.left}
			size="lg"
			onclick={() => onslotclick('weapon', 'left')}
		/>
	</div>
	<div class="col-start-2 row-start-2">
		<SlotButton
			slotLabel="Chest"
			itemName={armor.chest?.name}
			itemImage={armor.chest?.image}
			itemData={armor.chest}
			size="lg"
			onclick={() => onslotclick('armor', 'chest')}
		/>
	</div>
	<div class="col-start-3 row-start-2">
		<SlotButton
			slotLabel="Right Hand"
			itemName={weapons.right?.name}
			itemImage={weapons.right?.image}
			itemData={weapons.right}
			size="lg"
			onclick={() => onslotclick('weapon', 'right')}
		/>
	</div>
	<div class="col-start-2 row-start-3">
		<SlotButton
			slotLabel="Hands"
			itemName={armor.hands?.name}
			itemImage={armor.hands?.image}
			itemData={armor.hands}
			size="lg"
			onclick={() => onslotclick('armor', 'hands')}
		/>
	</div>
	<div class="col-start-2 row-start-4">
		<SlotButton
			slotLabel="Legs"
			itemName={armor.legs?.name}
			itemImage={armor.legs?.image}
			itemData={armor.legs}
			size="lg"
			onclick={() => onslotclick('armor', 'legs')}
		/>
	</div>
</div>

<!-- Talismans -->
<div class="flex gap-3 justify-center mt-8">
	{#each [0, 1, 2, 3] as i}
		<SlotButton
			slotLabel="Talisman {i + 1}"
			itemName={talismans[i]?.name}
			itemImage={talismans[i]?.image}
			itemData={talismans[i]}
			size="md"
			onclick={() => onslotclick('talisman', String(i))}
		/>
	{/each}
</div>
