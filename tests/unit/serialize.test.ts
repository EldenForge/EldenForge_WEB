import { describe, it, expect } from 'vitest';
import { serializeBuild, deserializeBuild, type BuildPayload } from '../../src/lib/builds/serialize';
import type { BuildState, Loadout } from '../../src/lib/types';

function baseStats() {
	return { vigor: 10, mind: 10, endurance: 10, strength: 10, dexterity: 10, intelligence: 10, faith: 10, arcane: 10 };
}

function emptyLoadout(name: string): Loadout {
	return {
		name,
		stats: baseStats(),
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

const EMPTY_LOOKUPS = {
	armors: [], talismans: [], weapons: [], shields: [],
	sorceries: [], incantations: [], spirits: [],
	ashes_of_war: [], ammos: []
};

describe('serializeBuild', () => {
	it('serializes an empty build state to v2 payload', () => {
		const state: BuildState = {
			loadouts: [emptyLoadout('Main')],
			activeIndex: 0
		};
		const payload = serializeBuild(state);
		expect(payload.v).toBe(2);
		expect(payload.loadouts).toHaveLength(1);
		expect(payload.activeIndex).toBe(0);
		expect(payload.loadouts[0].name).toBe('Main');
	});

	it('preserves multiple loadouts', () => {
		const state: BuildState = {
			loadouts: [emptyLoadout('Main'), emptyLoadout('Lvl 100'), emptyLoadout('Endgame')],
			activeIndex: 1
		};
		const payload = serializeBuild(state);
		expect(payload.loadouts).toHaveLength(3);
		expect(payload.loadouts.map((l) => l.name)).toEqual(['Main', 'Lvl 100', 'Endgame']);
		expect(payload.activeIndex).toBe(1);
	});

	it('serializes only item ids, not whole objects', () => {
		const state: BuildState = { loadouts: [emptyLoadout('Main')], activeIndex: 0 };
		const payload = serializeBuild(state);
		expect(typeof payload.loadouts[0].armor).toBe('object');
		// All armor slots are null in an empty loadout
		expect(payload.loadouts[0].armor.head).toBeNull();
	});
});

describe('deserializeBuild (v2)', () => {
	it('roundtrips a v2 payload with multi-loadouts', () => {
		const state: BuildState = {
			loadouts: [emptyLoadout('Main'), emptyLoadout('Lvl 150')],
			activeIndex: 0
		};
		const payload = serializeBuild(state);
		const restored = deserializeBuild(payload, EMPTY_LOOKUPS);
		expect(restored.loadouts).toHaveLength(2);
		expect(restored.loadouts[0].name).toBe('Main');
		expect(restored.loadouts[1].name).toBe('Lvl 150');
		expect(restored.activeIndex).toBe(0);
	});

	it('clamps activeIndex to a valid range', () => {
		const payload: BuildPayload = {
			v: 2,
			loadouts: [
				{
					name: 'Main',
					stats: baseStats(),
					armor: { head: null, chest: null, hands: null, legs: null },
					talismans: [null, null, null, null],
					weapons: { right: null, left: null, rightSecondary: [null, null], leftSecondary: [null, null] },
					ashes: { right: null, left: null, rightSecondary: [null, null], leftSecondary: [null, null] },
					ammos: { arrows: [null, null], bolts: [null, null] },
					spells: [null, null, null, null, null, null, null, null, null, null],
					spirit: null,
					guide: ''
				}
			],
			activeIndex: 999
		};
		const restored = deserializeBuild(payload, EMPTY_LOOKUPS);
		expect(restored.activeIndex).toBe(0);
	});
});

describe('deserializeBuild (v1 backward compatibility)', () => {
	it('wraps a v1 payload (no v key) into a single Main loadout', () => {
		const v1payload: BuildPayload = {
			stats: baseStats(),
			armor: { head: null, chest: null, hands: null, legs: null },
			talismans: [null, null, null, null],
			weapons: { right: null, left: null },
			spells: [null, null, null, null, null, null, null, null, null, null],
			spirit: null,
			guide: 'ancien guide'
		} as BuildPayload;

		const restored = deserializeBuild(v1payload, EMPTY_LOOKUPS);
		expect(restored.loadouts).toHaveLength(1);
		expect(restored.loadouts[0].name).toBe('Main');
		expect(restored.loadouts[0].guide).toBe('ancien guide');
		expect(restored.activeIndex).toBe(0);
	});

	it('handles v1 payload without ashes and ammos', () => {
		const v1: BuildPayload = {
			stats: baseStats(),
			armor: { head: null, chest: null, hands: null, legs: null },
			talismans: [null, null, null, null],
			weapons: { right: null, left: null },
			spells: [null, null, null, null, null, null, null, null, null, null],
			spirit: null,
			guide: ''
		} as BuildPayload;
		const restored = deserializeBuild(v1, EMPTY_LOOKUPS);
		expect(restored.loadouts[0].ashes.right).toBeNull();
		expect(restored.loadouts[0].ammos.arrows).toEqual([null, null]);
	});
});
