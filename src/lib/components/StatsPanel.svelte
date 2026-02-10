<script lang="ts">
	import type { CharacterStats } from '$lib/types';

	interface Props {
		stats: CharacterStats;
		onstatchange: (stat: keyof CharacterStats, value: number) => void;
	}
	let { stats, onstatchange }: Props = $props();

	const statLabels: { key: keyof CharacterStats; label: string }[] = [
		{ key: 'vigor', label: 'Vigor' },
		{ key: 'mind', label: 'Mind' },
		{ key: 'endurance', label: 'Endurance' },
		{ key: 'strength', label: 'Strength' },
		{ key: 'dexterity', label: 'Dexterity' },
		{ key: 'intelligence', label: 'Intelligence' },
		{ key: 'faith', label: 'Faith' },
		{ key: 'arcane', label: 'Arcane' }
	];

	function handleChange(stat: keyof CharacterStats, e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value) || 1;
		onstatchange(stat, Math.max(1, Math.min(99, val)));
	}
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
	{#each statLabels as { key, label }}
		<div class="flex flex-col items-center gap-1">
			<label class="text-xs text-gold/60 font-cinzel tracking-wider" for="stat-{key}">
				{label}
			</label>
			<input
				id="stat-{key}"
				type="number"
				min="1"
				max="99"
				value={stats[key]}
				onchange={(e) => handleChange(key, e)}
				class="w-full text-center bg-dark-800 border border-dark-400 text-parchment rounded
					py-2 text-lg font-cinzel focus:outline-none focus:border-gold
					focus:ring-1 focus:ring-gold/50 hover:border-gold/50 transition-all
					[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
					[&::-webkit-inner-spin-button]:appearance-none"
			/>
		</div>
	{/each}
</div>
