<script lang="ts">
	import { tooltipStore, type AnyItem } from '$lib/stores/tooltip';

	// Detect item type from shape
	function isWeapon(i: AnyItem) {
		return Array.isArray(i.attack);
	}
	function isArmor(i: AnyItem) {
		return Array.isArray(i.dmgNegation);
	}
	function isSpell(i: AnyItem) {
		return typeof i.cost === 'number' && typeof i.slots === 'number';
	}
	function isSpirit(i: AnyItem) {
		return typeof i.fpCost === 'number' || typeof i.hpCost === 'number';
	}
	function isTalisman(i: AnyItem) {
		return typeof i.effect === 'string' && !isSpirit(i);
	}

	type StatEntry = { name: string; amount: number };
	type ScalesWith = { name: string; scaling: string };

	// Position tooltip so it stays in viewport
	let tooltipEl = $state<HTMLDivElement | null>(null);
	let tx = $derived.by(() => {
		if (!tooltipEl) return $tooltipStore.x + 16;
		const w = tooltipEl.offsetWidth;
		return $tooltipStore.x + 16 + w > window.innerWidth
			? $tooltipStore.x - w - 8
			: $tooltipStore.x + 16;
	});
	let ty = $derived.by(() => {
		if (!tooltipEl) return $tooltipStore.y - 12;
		const h = tooltipEl.offsetHeight;
		return $tooltipStore.y - 12 + h > window.innerHeight
			? $tooltipStore.y - h + 12
			: $tooltipStore.y - 12;
	});

	const scalingColors: Record<string, string> = {
		S: 'text-yellow-300',
		A: 'text-green-400',
		B: 'text-blue-400',
		C: 'text-parchment/80',
		D: 'text-parchment/50',
		E: 'text-parchment/30'
	};
</script>

{#if $tooltipStore.visible && $tooltipStore.item}
	{@const item = $tooltipStore.item}
	<div
		bind:this={tooltipEl}
		class="fixed z-[9999] pointer-events-none w-64
			bg-dark-800 border border-gold/25 rounded-lg shadow-2xl
			text-parchment text-xs"
		style="left:{tx}px; top:{ty}px"
	>
		<!-- Header -->
		<div class="flex items-center gap-2 p-3 border-b border-dark-400/60">
			{#if item.image}
				<img
					src={item.image as string}
					alt={item.name}
					class="w-10 h-10 object-contain rounded bg-dark-900 shrink-0"
				/>
			{/if}
			<div class="min-w-0">
				<p class="font-cinzel text-gold text-[11px] leading-tight">{item.name}</p>
				{#if isWeapon(item)}
					<p class="text-parchment/40 text-[10px] mt-0.5">
						{item.category as string} · {item.weight as number} wt
					</p>
				{:else if isArmor(item)}
					<p class="text-parchment/40 text-[10px] mt-0.5">
						{item.category as string} · {item.weight as number} wt
					</p>
				{:else if isSpell(item)}
					<p class="text-parchment/40 text-[10px] mt-0.5">{item.type as string}</p>
				{:else if isSpirit(item)}
					<p class="text-parchment/40 text-[10px] mt-0.5">Spirit Ashes</p>
				{:else if isTalisman(item)}
					<p class="text-parchment/40 text-[10px] mt-0.5">Talisman</p>
				{/if}
			</div>
		</div>

		<div class="p-3 space-y-2.5">
			<!-- WEAPON stats -->
			{#if isWeapon(item)}
				{@const attack = item.attack as StatEntry[]}
				{@const scales = item.scalesWith as ScalesWith[]}
				{@const reqs = item.requiredAttributes as StatEntry[]}

				{#if attack?.some((a) => a.amount > 0)}
					<div>
						<p class="text-parchment/40 text-[9px] uppercase tracking-wider mb-1">Attack</p>
						<div class="flex flex-wrap gap-x-3 gap-y-0.5">
							{#each attack.filter((a) => a.amount > 0) as a}
								<span>{a.name} <span class="text-parchment font-medium">{a.amount}</span></span>
							{/each}
						</div>
					</div>
				{/if}

				{#if scales?.length}
					<div>
						<p class="text-parchment/40 text-[9px] uppercase tracking-wider mb-1">Scales with</p>
						<div class="flex flex-wrap gap-x-3 gap-y-0.5">
							{#each scales as s}
								<span>
									{s.name}
									<span class="{scalingColors[s.scaling] ?? 'text-parchment'} font-bold"
										>{s.scaling}</span
									>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if reqs?.some((r) => r.amount > 0)}
					<div>
						<p class="text-parchment/40 text-[9px] uppercase tracking-wider mb-1">Requires</p>
						<div class="flex flex-wrap gap-x-3 gap-y-0.5">
							{#each reqs.filter((r) => r.amount > 0) as r}
								<span>{r.name} <span class="text-parchment font-medium">{r.amount}</span></span>
							{/each}
						</div>
					</div>
				{/if}

			<!-- ARMOR stats -->
			{:else if isArmor(item)}
				{@const neg = item.dmgNegation as StatEntry[]}
				{@const res = item.resistance as StatEntry[]}

				{#if neg?.length}
					<div>
						<p class="text-parchment/40 text-[9px] uppercase tracking-wider mb-1">
							Damage Negation
						</p>
						<div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
							{#each neg as n}
								<span>{n.name} <span class="text-parchment font-medium">{n.amount}</span></span>
							{/each}
						</div>
					</div>
				{/if}

				{#if res?.length}
					<div>
						<p class="text-parchment/40 text-[9px] uppercase tracking-wider mb-1">Resistance</p>
						<div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
							{#each res as r}
								<span>{r.name} <span class="text-parchment font-medium">{r.amount}</span></span>
							{/each}
						</div>
					</div>
				{/if}

			<!-- SPELL stats -->
			{:else if isSpell(item)}
				<div class="flex gap-4">
					<span>FP <span class="text-blue-400 font-medium">{item.cost as number}</span></span>
					<span
						>Slots <span class="text-gold font-medium">{item.slots as number}</span></span
					>
				</div>
				{#if item.effects}
					<p class="text-parchment/70 italic">{item.effects as string}</p>
				{/if}
				{#if (item.requires as StatEntry[])?.some((r) => r.amount > 0)}
					<div>
						<p class="text-parchment/40 text-[9px] uppercase tracking-wider mb-1">Requires</p>
						<div class="flex flex-wrap gap-x-3 gap-y-0.5">
							{#each (item.requires as StatEntry[]).filter((r) => r.amount > 0) as r}
								<span>{r.name} <span class="text-parchment font-medium">{r.amount}</span></span>
							{/each}
						</div>
					</div>
				{/if}

			<!-- SPIRIT stats -->
			{:else if isSpirit(item)}
				<div class="flex gap-4">
					{#if item.fpCost}
						<span>FP <span class="text-blue-400 font-medium">{item.fpCost as number}</span></span>
					{/if}
					{#if item.hpCost}
						<span>HP <span class="text-red-400 font-medium">{item.hpCost as number}</span></span>
					{/if}
				</div>
				{#if item.effect}
					<p class="text-parchment/70 italic">{item.effect as string}</p>
				{/if}

			<!-- TALISMAN -->
			{:else if isTalisman(item)}
				{#if item.effect}
					<p class="text-gold/80 italic">{item.effect as string}</p>
				{/if}
			{/if}

			<!-- Description (all types) -->
			{#if item.description}
				<p class="text-parchment/35 italic text-[10px] border-t border-dark-400/40 pt-2 leading-relaxed line-clamp-3">
					{item.description as string}
				</p>
			{/if}
		</div>
	</div>
{/if}
