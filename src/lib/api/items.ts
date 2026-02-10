import { get } from './client';
import type { Armor, Talisman, Weapon, Shield } from '$lib/types';

let armorCache: Armor[] | null = null;
let talismanCache: Talisman[] | null = null;
let weaponCache: Weapon[] | null = null;
let shieldCache: Shield[] | null = null;

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

export async function loadAllItems() {
	const [armors, talismans, weapons, shields] = await Promise.all([
		fetchArmors(),
		fetchTalismans(),
		fetchWeapons(),
		fetchShields()
	]);
	return { armors, talismans, weapons, shields };
}
