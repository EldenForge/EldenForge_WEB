<script lang="ts">
	import { TAG_GROUPS } from '$lib/builds/tags';
	interface Props {
		selected: string[];
		onchange: (tags: string[]) => void;
	}
	let { selected, onchange }: Props = $props();

	function toggle(tag: string) {
		if (selected.includes(tag)) {
			onchange(selected.filter((t) => t !== tag));
		} else {
			onchange([...selected, tag]);
		}
	}
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
	{#each TAG_GROUPS as group}
		<div>
			<p class="text-[10px] font-cinzel uppercase tracking-[0.2em] text-gold/50 mb-1.5 border-b border-gold/15 pb-1">
				{group.label}
			</p>
			<div class="flex flex-wrap gap-1.5">
				{#each group.tags as tag}
					<button
						type="button"
						onclick={() => toggle(tag)}
						class="text-xs font-cinzel rounded px-2 py-1 border transition-colors cursor-pointer
							{selected.includes(tag)
							? 'text-gold bg-gold/15 border-gold/50'
							: 'text-parchment/50 border-dark-400 hover:border-gold/30'}"
					>
						{tag}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>
