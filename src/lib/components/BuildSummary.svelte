<script lang="ts">
	import type { BuildState } from '$lib/types';
	import { tooltipStore, type AnyItem } from '$lib/stores/tooltip';

	interface Props {
		build: BuildState;
	}

	let { build }: Props = $props();

	let weapons = $derived(
		[
			{ label: 'Right hand', item: build.weapons.right },
			{ label: 'Left hand', item: build.weapons.left }
		].filter((w) => w.item)
	);
	let armorPieces = $derived(
		[
			{ label: 'Head', item: build.armor.head },
			{ label: 'Chest', item: build.armor.chest },
			{ label: 'Hands', item: build.armor.hands },
			{ label: 'Legs', item: build.armor.legs }
		].filter((a) => a.item)
	);
	let talismans = $derived(build.talismans.filter((t) => t !== null));
	let spells = $derived(build.spells.filter((s) => s !== null));

	let totalWeight = $derived(
		(build.armor.head?.weight ?? 0) +
			(build.armor.chest?.weight ?? 0) +
			(build.armor.hands?.weight ?? 0) +
			(build.armor.legs?.weight ?? 0) +
			(build.weapons.right?.weight ?? 0) +
			(build.weapons.left?.weight ?? 0)
	);

	let isEmpty = $derived(
		weapons.length === 0 &&
			armorPieces.length === 0 &&
			talismans.length === 0 &&
			spells.length === 0 &&
			build.spirit === null
	);
</script>

{#snippet itemRow(item: AnyItem, sub?: string | null)}
	<div
		class="flex items-center gap-2 py-1.5 border-b border-dark-400/40 last:border-0"
		role="presentation"
		onmouseenter={(e) => tooltipStore.show(item, e.clientX, e.clientY)}
		onmousemove={(e) => tooltipStore.move(e.clientX, e.clientY)}
		onmouseleave={() => tooltipStore.hide()}
	>
		{#if item.image}
			<img
				src={item.image}
				alt={item.name}
				class="w-8 h-8 object-contain rounded shrink-0 bg-dark-800"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{/if}
		<div class="min-w-0 flex-1">
			<span class="text-parchment text-sm block truncate">{item.name}</span>
			{#if sub}
				<span class="text-gold/40 text-[11px] italic line-clamp-1">{sub}</span>
			{/if}
		</div>
	</div>
{/snippet}

{#if isEmpty}
	<p class="text-parchment/30 text-sm italic font-cinzel">No equipment in this build.</p>
{:else}
	<div class="grid sm:grid-cols-2 gap-x-6 gap-y-4">
		{#if weapons.length}
			<div>
				<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-1">Weapons</h3>
				{#each weapons as w}
					{@render itemRow(w.item!, w.label)}
				{/each}
			</div>
		{/if}

		{#if armorPieces.length}
			<div>
				<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-1">Armor</h3>
				{#each armorPieces as a}
					{@render itemRow(a.item!)}
				{/each}
			</div>
		{/if}

		{#if talismans.length}
			<div>
				<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-1">Talismans</h3>
				{#each talismans as t}
					{@render itemRow(t!, t!.effect)}
				{/each}
			</div>
		{/if}

		{#if spells.length}
			<div>
				<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-1">Spells</h3>
				{#each spells as s}
					{@render itemRow(s!, s!.effects)}
				{/each}
			</div>
		{/if}

		{#if build.spirit}
			<div>
				<h3 class="text-xs text-gold/60 font-cinzel tracking-widest uppercase mb-1">Spirit Ashes</h3>
				{@render itemRow(build.spirit, build.spirit.effect)}
			</div>
		{/if}
	</div>

	<div class="flex justify-between items-center mt-4 pt-3 border-t border-gold/20">
		<span class="font-cinzel text-gold text-sm tracking-wider">Total Weight</span>
		<span class="font-cinzel text-gold text-lg">{totalWeight.toFixed(1)}</span>
	</div>
{/if}
