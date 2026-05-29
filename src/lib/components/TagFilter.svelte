<script lang="ts">
	import { ALLOWED_TAGS } from '$lib/builds/tags';
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

<div class="flex flex-wrap gap-1.5">
	{#each ALLOWED_TAGS as tag}
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
