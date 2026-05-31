import { writable, derived } from 'svelte/store';
import type {
	Armor,
	Talisman,
	Weapon,
	Spell,
	Spirit,
	AshOfWar,
	Ammo,
	BuildState,
	Loadout,
	CharacterStats
} from '$lib/types';

function getInitialLoadout(name = 'Main'): Loadout {
	return {
		name,
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
		weapons: { right: null, left: null, rightSecondary: [null, null], leftSecondary: [null, null] },
		ashes: { right: null, left: null, rightSecondary: [null, null], leftSecondary: [null, null] },
		ammos: { arrows: [null, null], bolts: [null, null] },
		spells: [null, null, null, null, null, null, null, null, null, null],
		spirit: null,
		guide: ''
	};
}

function getInitialState(): BuildState {
	return { loadouts: [getInitialLoadout()], activeIndex: 0 };
}

function patchActive(s: BuildState, patch: Partial<Loadout>): BuildState {
	const loadouts = s.loadouts.map((l, i) => (i === s.activeIndex ? { ...l, ...patch } : l));
	return { ...s, loadouts };
}

function createBuildStore() {
	const { subscribe, set, update } = writable<BuildState>(getInitialState());

	return {
		subscribe,
		// ── Modifications de la loadout active ──
		setStat: (stat: keyof CharacterStats, value: number) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				return patchActive(s, { stats: { ...active.stats, [stat]: Math.max(1, Math.min(99, value)) } });
			}),
		setArmor: (slot: 'head' | 'chest' | 'hands' | 'legs', item: Armor | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				return patchActive(s, { armor: { ...active.armor, [slot]: item } });
			}),
		setTalisman: (index: number, item: Talisman | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				const talismans = [...active.talismans];
				talismans[index] = item;
				return patchActive(s, { talismans });
			}),
		setWeapon: (slot: 'right' | 'left', item: Weapon | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				return patchActive(s, { weapons: { ...active.weapons, [slot]: item } });
			}),
		setSecondaryWeapon: (side: 'right' | 'left', index: 0 | 1, item: Weapon | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				const key = side === 'right' ? 'rightSecondary' : 'leftSecondary';
				const arr = [...active.weapons[key]];
				arr[index] = item;
				return patchActive(s, { weapons: { ...active.weapons, [key]: arr } });
			}),
		setAsh: (slot: 'right' | 'left', item: AshOfWar | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				return patchActive(s, { ashes: { ...active.ashes, [slot]: item } });
			}),
		setSecondaryAsh: (side: 'right' | 'left', index: 0 | 1, item: AshOfWar | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				const key = side === 'right' ? 'rightSecondary' : 'leftSecondary';
				const arr = [...active.ashes[key]];
				arr[index] = item;
				return patchActive(s, { ashes: { ...active.ashes, [key]: arr } });
			}),
		setAmmo: (kind: 'arrows' | 'bolts', index: 0 | 1, item: Ammo | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				const arr = [...active.ammos[kind]];
				arr[index] = item;
				return patchActive(s, { ammos: { ...active.ammos, [kind]: arr } });
			}),
		setSpell: (index: number, item: Spell | null) =>
			update((s) => {
				const active = s.loadouts[s.activeIndex];
				const spells = [...active.spells];
				spells[index] = item;
				return patchActive(s, { spells });
			}),
		setSpirit: (item: Spirit | null) =>
			update((s) => patchActive(s, { spirit: item })),
		setGuide: (text: string) =>
			update((s) => patchActive(s, { guide: text })),

		// ── Gestion des pages (loadouts) ──
		addLoadout: (name?: string) =>
			update((s) => {
				const base = `Page ${s.loadouts.length + 1}`;
				const newLoadout = getInitialLoadout(name ?? base);
				return { loadouts: [...s.loadouts, newLoadout], activeIndex: s.loadouts.length };
			}),
		duplicateLoadout: (index: number) =>
			update((s) => {
				const source = s.loadouts[index];
				if (!source) return s;
				const copy: Loadout = JSON.parse(JSON.stringify(source));
				copy.name = `${source.name} (copy)`;
				const insertAt = index + 1;
				const loadouts = [...s.loadouts.slice(0, insertAt), copy, ...s.loadouts.slice(insertAt)];
				return { loadouts, activeIndex: insertAt };
			}),
		removeLoadout: (index: number) =>
			update((s) => {
				if (s.loadouts.length <= 1) return s; // min 1 page
				const loadouts = s.loadouts.filter((_, i) => i !== index);
				let activeIndex = s.activeIndex;
				if (index < s.activeIndex) activeIndex = s.activeIndex - 1;
				else if (index === s.activeIndex) activeIndex = Math.min(s.activeIndex, loadouts.length - 1);
				return { loadouts, activeIndex };
			}),
		renameLoadout: (index: number, name: string) =>
			update((s) => {
				const loadouts = s.loadouts.map((l, i) => (i === index ? { ...l, name } : l));
				return { ...s, loadouts };
			}),
		setActiveLoadout: (index: number) =>
			update((s) => ({ ...s, activeIndex: Math.max(0, Math.min(s.loadouts.length - 1, index)) })),

		// ── Imports complets ──
		setAll: (state: BuildState) => set(state),
		reset: () => set(getInitialState())
	};
}

export const buildStore = createBuildStore();

/** Loadout actuellement edite. Equivalent ergonomique de `$buildStore.loadouts[$buildStore.activeIndex]`. */
export const activeLoadout = derived(buildStore, ($s) => $s.loadouts[$s.activeIndex]);

export { getInitialLoadout };
