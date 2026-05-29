import { writable } from 'svelte/store';

// Ouvre la modale de connexion depuis n'importe quel composant.
export const authModalOpen = writable(false);

export function openLoginModal(): void {
	authModalOpen.set(true);
}
