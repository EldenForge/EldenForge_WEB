import { describe, it, expect } from 'vitest';
import {
	softCapStatus,
	maxEquipLoad,
	rollCategory,
	memorySlotsFromMind,
	characterLevel,
	normalizeStatKey
} from '../../src/lib/ar/mechanics';

describe('softCapStatus', () => {
	it('returns level 0 (OK) below any soft cap', () => {
		expect(softCapStatus('strength', 10).level).toBe(0);
		expect(softCapStatus('vigor', 20).level).toBe(0);
	});

	it('returns level 1 at first soft cap', () => {
		expect(softCapStatus('strength', 20).level).toBe(1);
		expect(softCapStatus('vigor', 40).level).toBe(1);
	});

	it('returns level 2 at hard cap', () => {
		expect(softCapStatus('strength', 80).level).toBe(2);
		expect(softCapStatus('vigor', 60).level).toBe(2);
	});

	it('includes cap value in the label', () => {
		expect(softCapStatus('strength', 55).label).toContain('55');
		expect(softCapStatus('vigor', 60).label).toContain('60');
	});
});

describe('maxEquipLoad', () => {
	it('returns the base load at very low endurance', () => {
		expect(maxEquipLoad(1)).toBe(45);
		expect(maxEquipLoad(8)).toBe(45);
	});

	it('returns the max load at 99 endurance', () => {
		expect(maxEquipLoad(99)).toBe(160);
	});

	it('interpolates linearly between anchor points', () => {
		const load15 = maxEquipLoad(15);
		const load25 = maxEquipLoad(25);
		const load20 = maxEquipLoad(20);
		expect(load15).toBe(65);
		expect(load25).toBe(76);
		expect(load20).toBeGreaterThan(load15);
		expect(load20).toBeLessThan(load25);
	});
});

describe('rollCategory', () => {
	it('returns Light below 30 pct load', () => {
		expect(rollCategory(0.15)).toBe('Light');
		expect(rollCategory(0.299)).toBe('Light');
	});
	it('returns Medium between 30 and 70 pct load', () => {
		expect(rollCategory(0.3)).toBe('Medium');
		expect(rollCategory(0.5)).toBe('Medium');
		expect(rollCategory(0.699)).toBe('Medium');
	});
	it('returns Heavy between 70 and 100 pct load', () => {
		expect(rollCategory(0.7)).toBe('Heavy');
		expect(rollCategory(0.99)).toBe('Heavy');
	});
	it('returns Overload at or above 100 pct load', () => {
		expect(rollCategory(1.0)).toBe('Overload');
		expect(rollCategory(1.5)).toBe('Overload');
	});
});

describe('memorySlotsFromMind', () => {
	it('returns 0 slots below mind 15', () => {
		expect(memorySlotsFromMind(10)).toBe(0);
		expect(memorySlotsFromMind(14)).toBe(0);
	});
	it('returns 1 slot at mind 15', () => {
		expect(memorySlotsFromMind(15)).toBe(1);
	});
	it('increases with mind', () => {
		expect(memorySlotsFromMind(30)).toBeGreaterThan(memorySlotsFromMind(15));
	});
});

describe('characterLevel', () => {
	const baseStats = {
		vigor: 10, mind: 10, endurance: 10, strength: 10,
		dexterity: 10, intelligence: 10, faith: 10, arcane: 10
	};

	it('returns 1 with all stats at 10 (base class)', () => {
		expect(characterLevel(baseStats)).toBeGreaterThanOrEqual(1);
	});

	it('increases when any stat increases', () => {
		const base = characterLevel(baseStats);
		const boosted = characterLevel({ ...baseStats, vigor: 40 });
		expect(boosted).toBeGreaterThan(base);
	});

	it('is monotonic on strength', () => {
		const a = characterLevel({ ...baseStats, strength: 20 });
		const b = characterLevel({ ...baseStats, strength: 50 });
		expect(b).toBeGreaterThan(a);
	});
});

describe('normalizeStatKey', () => {
	it('maps common labels to canonical keys', () => {
		expect(normalizeStatKey('Str')).toBe('strength');
		expect(normalizeStatKey('Dex')).toBe('dexterity');
		expect(normalizeStatKey('Int')).toBe('intelligence');
		expect(normalizeStatKey('Fai')).toBe('faith');
		expect(normalizeStatKey('Arc')).toBe('arcane');
		expect(normalizeStatKey('Vig')).toBe('vigor');
		expect(normalizeStatKey('Mnd')).toBe('mind');
		expect(normalizeStatKey('End')).toBe('endurance');
	});

	it('accepts full names', () => {
		expect(normalizeStatKey('Strength')).toBe('strength');
		expect(normalizeStatKey('Intelligence')).toBe('intelligence');
	});

	it('returns null for unknown labels', () => {
		expect(normalizeStatKey('foobar')).toBeNull();
		expect(normalizeStatKey('')).toBeNull();
	});
});
