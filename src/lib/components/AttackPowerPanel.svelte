<script lang="ts">
	import type { Weapon } from '$lib/types';
	import { fetchWeaponUpgrades, type UpgradeRow } from '$lib/api/items';
	import {
		computeAR,
		pickUpgradeRow,
		maxUpgradeLevel,
		DAMAGE_LABEL,
		DAMAGE_COLOR,
		type CharStats,
		type DamageType
	} from '$lib/ar/ar';
	import BarList from './charts/BarList.svelte';

	interface Props {
		weapon: Weapon;
		stats: CharStats;
	}

	let { weapon, stats }: Props = $props();

	let rows = $state<UpgradeRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let level = $state(0);

	$effect(() => {
		if (!weapon?.id) return;
		let cancelled = false;
		loading = true;
		rows = [];
		fetchWeaponUpgrades(weapon.id)
			.then((r) => {
				if (cancelled) return;
				rows = r;
				level = maxUpgradeLevel(r);
				loading = false;
			})
			.catch((e) => {
				if (cancelled) return;
				error = e instanceof Error ? e.message : 'Failed to load upgrades';
				loading = false;
			});
		return () => {
			cancelled = true;
		};
	});

	const maxLevel = $derived(maxUpgradeLevel(rows));
	const currentRow = $derived(pickUpgradeRow(rows, level));
	const ar = $derived(currentRow ? computeAR(weapon.name, currentRow, stats) : null);

	const items = $derived(
		ar
			? (['phy', 'mag', 'fir', 'lit', 'hol'] as DamageType[])
					.filter((t) => ar[t] > 0)
					.map((t) => ({ label: DAMAGE_LABEL[t], value: Math.floor(ar[t]), color: DAMAGE_COLOR[t] }))
			: []
	);
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-xs">
		{#if weapon.image}
			<img
				src={weapon.image}
				alt={weapon.name}
				class="w-6 h-6 object-contain bg-dark-800 rounded shrink-0"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{/if}
		<span class="font-cinzel text-parchment/80 truncate flex-1">{weapon.name}</span>
		{#if !loading && maxLevel > 0}
			<div class="relative shrink-0">
				<select
					bind:value={level}
					class="appearance-none bg-dark-800 border border-dark-400 rounded text-xs text-parchment/80 pl-2 pr-5 py-0.5 font-cinzel cursor-pointer focus:outline-none focus:border-gold/50"
				>
					{#each Array.from({ length: maxLevel + 1 }, (_, i) => i) as L}
						<option value={L}>+{L}</option>
					{/each}
				</select>
				<svg
					class="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gold/70 pointer-events-none"
					viewBox="0 0 12 12"
					fill="currentColor"
				>
					<path d="M6 8L1 3h10z" />
				</svg>
			</div>
		{/if}
	</div>

	{#if loading}
		<p class="text-parchment/30 text-[11px] italic">Loading upgrade data…</p>
	{:else if error}
		<p class="text-red-400/70 text-[11px]">{error}</p>
	{:else if !ar || !currentRow}
		<p class="text-parchment/30 text-[11px] italic">No upgrade data</p>
	{:else}
		<BarList {items} labelWidth="2.5rem" />
		<div class="flex justify-between items-center text-xs font-cinzel pt-1 border-t border-gold/20">
			<span class="text-gold/70">AR Total</span>
			<span class="text-gold text-base">{ar.total}</span>
		</div>
	{/if}
</div>
