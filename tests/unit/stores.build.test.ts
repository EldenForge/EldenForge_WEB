import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { buildStore, activeLoadout } from '../../src/lib/stores/build';

describe('buildStore multi-loadouts', () => {
	beforeEach(() => {
		buildStore.reset();
	});

	it('starts with a single Main loadout', () => {
		const s = get(buildStore);
		expect(s.loadouts).toHaveLength(1);
		expect(s.loadouts[0].name).toBe('Main');
		expect(s.activeIndex).toBe(0);
	});

	it('addLoadout appends a new loadout and activates it', () => {
		buildStore.addLoadout('Lvl 100');
		const s = get(buildStore);
		expect(s.loadouts).toHaveLength(2);
		expect(s.loadouts[1].name).toBe('Lvl 100');
		expect(s.activeIndex).toBe(1);
	});

	it('addLoadout without name uses a default Page N', () => {
		buildStore.addLoadout();
		const s = get(buildStore);
		expect(s.loadouts[1].name).toMatch(/^Page \d+$/);
	});

	it('renameLoadout persists the new name', () => {
		buildStore.addLoadout('Foo');
		buildStore.renameLoadout(1, 'Bar');
		expect(get(buildStore).loadouts[1].name).toBe('Bar');
	});

	it('removeLoadout keeps at least one loadout', () => {
		buildStore.removeLoadout(0);
		const s = get(buildStore);
		expect(s.loadouts).toHaveLength(1);
	});

	it('removeLoadout removes the requested one', () => {
		buildStore.addLoadout('A');
		buildStore.addLoadout('B');
		buildStore.removeLoadout(1);
		const s = get(buildStore);
		expect(s.loadouts).toHaveLength(2);
		expect(s.loadouts.map((l) => l.name)).toEqual(['Main', 'B']);
	});

	it('setActiveLoadout switches active pointer', () => {
		buildStore.addLoadout('Second');
		buildStore.setActiveLoadout(0);
		expect(get(buildStore).activeIndex).toBe(0);
	});

	it('setActiveLoadout clamps to valid range', () => {
		buildStore.setActiveLoadout(999);
		expect(get(buildStore).activeIndex).toBe(0);
		buildStore.setActiveLoadout(-1);
		expect(get(buildStore).activeIndex).toBe(0);
	});

	it('duplicateLoadout clones the source with (copy) suffix', () => {
		buildStore.renameLoadout(0, 'Original');
		buildStore.duplicateLoadout(0);
		const s = get(buildStore);
		expect(s.loadouts).toHaveLength(2);
		expect(s.loadouts[1].name).toBe('Original (copy)');
		expect(s.activeIndex).toBe(1);
	});

	it('setStat mutates only the active loadout stats', () => {
		buildStore.setStat('vigor', 40);
		expect(get(activeLoadout).stats.vigor).toBe(40);
	});

	it('setStat clamps between 1 and 99', () => {
		buildStore.setStat('vigor', 200);
		expect(get(activeLoadout).stats.vigor).toBe(99);
		buildStore.setStat('vigor', -5);
		expect(get(activeLoadout).stats.vigor).toBe(1);
	});

	it('setGuide updates only the active loadout guide', () => {
		buildStore.setGuide('mon guide');
		expect(get(activeLoadout).guide).toBe('mon guide');
	});

	it('activeLoadout derived reflects the active index', () => {
		buildStore.addLoadout('Second');
		buildStore.setStat('vigor', 55);
		expect(get(activeLoadout).stats.vigor).toBe(55);
		buildStore.setActiveLoadout(0);
		expect(get(activeLoadout).stats.vigor).toBe(10); // Main not modified
	});

	it('renameLoadout keeps activeIndex stable', () => {
		buildStore.addLoadout('Second');
		buildStore.renameLoadout(1, 'Newname');
		expect(get(buildStore).activeIndex).toBe(1);
	});
});
