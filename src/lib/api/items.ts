import { get } from './client';
import type { Armor, Talisman, Weapon, Shield, Sorcery, Incantation, Spirit } from '$lib/types';

let armorCache: Armor[] | null = null;
let talismanCache: Talisman[] | null = null;
let weaponCache: Weapon[] | null = null;
let shieldCache: Shield[] | null = null;
let sorceryCache: Sorcery[] | null = null;
let incantationCache: Incantation[] | null = null;
let spiritCache: Spirit[] | null = null;

export async function fetchArmors(): Promise<Armor[]> {
	if (armorCache) return armorCache;
	armorCache = await get<Armor[]>('/armors');
	return armorCache;
}

export async function fetchTalismans(): Promise<Talisman[]> {
	if (talismanCache) return talismanCache;
	talismanCache = await get<Talisman[]>('/talismans');
	return talismanCache;
}

export async function fetchWeapons(): Promise<Weapon[]> {
	if (weaponCache) return weaponCache;
	weaponCache = await get<Weapon[]>('/weapons');
	return weaponCache;
}

export async function fetchShields(): Promise<Shield[]> {
	if (shieldCache) return shieldCache;
	shieldCache = await get<Shield[]>('/shields');
	return shieldCache;
}

export async function fetchSorceries(): Promise<Sorcery[]> {
	if (sorceryCache) return sorceryCache;
	sorceryCache = await get<Sorcery[]>('/sorceries');
	return sorceryCache;
}

export async function fetchIncantations(): Promise<Incantation[]> {
	if (incantationCache) return incantationCache;
	incantationCache = await get<Incantation[]>('/incantations');
	return incantationCache;
}

export async function fetchSpirits(): Promise<Spirit[]> {
	if (spiritCache) return spiritCache;
	spiritCache = await get<Spirit[]>('/spirits');
	return spiritCache;
}

export async function loadAllItems() {
	const [armors, talismans, weapons, shields, sorceries, incantations, spirits] =
		await Promise.all([
			fetchArmors(),
			fetchTalismans(),
			fetchWeapons(),
			fetchShields(),
			fetchSorceries(),
			fetchIncantations(),
			fetchSpirits()
		]);
	return { armors, talismans, weapons, shields, sorceries, incantations, spirits };
}
