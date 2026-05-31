<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	interface Props {
		onlogin: () => void;
	}
	let { onlogin }: Props = $props();

	let dropdownOpen = $state(false);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	async function handleLogout() {
		await authStore.logout();
		dropdownOpen = false;
		goto('/');
	}

	function handleOutsideClick(e: MouseEvent) {
		if (!(e.target as HTMLElement).closest('[data-user-menu]')) {
			dropdownOpen = false;
		}
	}
</script>

<svelte:window onclick={handleOutsideClick} />

{#if $authStore.user}
	<div class="relative" data-user-menu>
		<button
			type="button"
			onclick={toggleDropdown}
			class="flex items-center gap-2 px-3 py-1 rounded font-cinzel text-xs tracking-wider
				text-gold bg-gold/10 border border-gold/30 hover:bg-gold/20 cursor-pointer transition-colors"
		>
			<span class="truncate max-w-32">{$authStore.user.pseudo}</span>
			<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10z" /></svg>
		</button>

		{#if dropdownOpen}
			<div
				class="absolute right-0 mt-2 w-44 bg-dark-700 border border-gold/30 rounded-lg
					shadow-xl shadow-black/50 overflow-hidden z-30"
			>
				<a
					href="/u/{encodeURIComponent($authStore.user.pseudo)}"
					onclick={() => (dropdownOpen = false)}
					class="block px-4 py-2 text-sm text-parchment hover:bg-dark-600 hover:text-gold transition-colors"
				>
					My profile
				</a>
				<a
					href="/profile"
					onclick={() => (dropdownOpen = false)}
					class="block px-4 py-2 text-sm text-parchment hover:bg-dark-600 hover:text-gold transition-colors border-t border-dark-500"
				>
					Settings
				</a>
				<button
					type="button"
					onclick={handleLogout}
					class="w-full text-left px-4 py-2 text-sm text-parchment hover:bg-dark-600 hover:text-red-400 transition-colors cursor-pointer border-t border-dark-500"
				>
					Logout
				</button>
			</div>
		{/if}
	</div>
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
