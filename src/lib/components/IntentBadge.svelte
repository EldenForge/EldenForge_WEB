<script lang="ts">
	import type { BuildIntent } from '$lib/api/builds';

	interface Props {
		intent: BuildIntent;
		size?: 'sm' | 'md';
	}

	let { intent, size = 'sm' }: Props = $props();

	const meta: Record<BuildIntent, { label: string; cls: string }> = {
		pve: {
			label: 'PvE',
			cls: 'text-emerald-300 border-emerald-400/50 bg-emerald-400/10'
		},
		coop: {
			label: 'Co-op',
			cls: 'text-sky-300 border-sky-400/50 bg-sky-400/10'
		},
		pvp: {
			label: 'PvP',
			cls: 'text-rose-300 border-rose-400/50 bg-rose-400/10'
		}
	};

	const sizeCls = $derived(size === 'md' ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5');
</script>

<span class="inline-block font-cinzel tracking-wider border rounded {sizeCls} {meta[intent].cls}">
	{meta[intent].label}
</span>
