import { writable } from 'svelte/store';
import type { Armor, Talisman, Weapon, BuildState } from '$lib/types';

function getInitialState(): BuildState {
	return {
		armor: { head: null, chest: null, hands: null, legs: null },
		talismans: [null, null, null, null],
		weapons: { right: null, left: null }
	};
}

function createBuildStore() {
	const { subscribe, set, update } = writable<BuildState>(getInitialState());

	return {
		subscribe,
		setArmor: (slot: 'head' | 'chest' | 'hands' | 'legs', item: Armor | null) =>
			update((s) => ({ ...s, armor: { ...s.armor, [slot]: item } })),
		setTalisman: (index: number, item: Talisman | null) =>
			update((s) => {
				const talismans = [...s.talismans];
				talismans[index] = item;
				return { ...s, talismans };
			}),
		setWeapon: (slot: 'right' | 'left', item: Weapon | null) =>
			update((s) => ({ ...s, weapons: { ...s.weapons, [slot]: item } })),
		reset: () => set(getInitialState())
	};
}

export const buildStore = createBuildStore();
