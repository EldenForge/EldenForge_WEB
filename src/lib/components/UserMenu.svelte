<script lang="ts">
	import { authStore } from '$lib/stores/auth';

	interface Props {
		onlogin: () => void;
	}
	let { onlogin }: Props = $props();
</script>

{#if $authStore.user}
	<a
		href="/profile"
		class="flex items-center gap-2 px-3 py-1 rounded font-cinzel text-xs tracking-wider
			text-gold bg-gold/10 border border-gold/30 hover:bg-gold/20 cursor-pointer transition-colors"
		title="Open profile"
	>
		<span class="truncate max-w-32">{$authStore.user.pseudo}</span>
	</a>
{:else if $authStore.bootstrapped}
	<button
		type="button"
		onclick={onlogin}
		class="px-3 py-1 rounded font-cinzel text-xs tracking-wider text-gold
			bg-gold/10 border border-gold/30 hover:bg-gold/20 cursor-pointer transition-colors"
	>
		Login
	</button>
{:else}
	<div class="w-16 h-7"></div>
{/if}
