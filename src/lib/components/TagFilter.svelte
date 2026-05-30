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

<div class="flex flex-col gap-2">
	{#each TAG_GROUPS as group}
		<div class="flex items-center gap-2 flex-wrap">
			<span class="text-[10px] font-cinzel uppercase tracking-widest text-gold/50 w-24 shrink-0">
				{group.label}
			</span>
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
