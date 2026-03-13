import { writable } from 'svelte/store';
import type { Armor, Talisman, Weapon, Spell, Spirit, BuildState, CharacterStats } from '$lib/types';

function getInitialState(): BuildState {
	return {
		stats: {
			vigor: 10,
			mind: 10,
			endurance: 10,
			strength: 10,
			dexterity: 10,
			intelligence: 10,
			faith: 10,
			arcane: 10
		},
		armor: { head: null, chest: null, hands: null, legs: null },
		talismans: [null, null, null, null],
		weapons: { right: null, left: null },
		spells: [null, null, null, null, null, null, null, null, null, null],
		spirit: null,
		guide: ''
	};
}

function createBuildStore() {
	const { subscribe, set, update } = writable<BuildState>(getInitialState());

	return {
		subscribe,
		setStat: (stat: keyof CharacterStats, value: number) =>
			update((s) => ({ ...s, stats: { ...s.stats, [stat]: Math.max(1, Math.min(99, value)) } })),
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
		setSpell: (index: number, item: Spell | null) =>
			update((s) => {
				const spells = [...s.spells];
				spells[index] = item;
				return { ...s, spells };
			}),
		setSpirit: (item: Spirit | null) => update((s) => ({ ...s, spirit: item })),
		setGuide: (text: string) => update((s) => ({ ...s, guide: text })),
		reset: () => set(getInitialState())
	};
}

export const buildStore = createBuildStore();
