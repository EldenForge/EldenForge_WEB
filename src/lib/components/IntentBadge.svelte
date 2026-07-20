<script lang="ts">
	import type { BuildIntent } from '$lib/api/builds';

	interface Props {
		intent: BuildIntent;
		size?: 'sm' | 'md';
	}

	let { intent, size = 'sm' }: Props = $props();

	const meta: Record<BuildIntent, { label: string; cls: string; aria: string }> = {
		pve: {
			label: 'PvE',
			cls: 'text-emerald-100 border-emerald-300/70 bg-emerald-500/25',
			aria: 'Mode PvE, joueur contre environnement'
		},
		coop: {
			label: 'Co-op',
			cls: 'text-sky-100 border-sky-300/70 bg-sky-500/25',
			aria: 'Mode coopératif'
		},
		pvp: {
			label: 'PvP',
			cls: 'text-rose-100 border-rose-300/70 bg-rose-500/25',
			aria: 'Mode PvP, joueur contre joueur'
		}
	};

	const sizeCls = $derived(size === 'md' ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5');
</script>

<span
	class="inline-block font-cinzel tracking-wider border rounded {sizeCls} {meta[intent].cls}"
	aria-label={meta[intent].aria}
>
	{meta[intent].label}
</span>
