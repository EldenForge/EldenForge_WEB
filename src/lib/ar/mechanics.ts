/**
 * Mécaniques Elden Ring : soft caps, equip load, memory slots, niveau perso.
 * Valeurs / formules documentées par la communauté (Fextralife / wiki).
 */
import type { CharacterStats } from '$lib/types';

// ── Soft caps par stat ────────────────────────────────────────────────
// Premier seuil = ralentissement notable des gains. Hard cap = ~aucun gain au-delà.
export const SOFT_CAPS: Record<keyof CharacterStats, number[]> = {
	vigor: [40, 60],
	mind: [50, 60],
	endurance: [25, 50],
	strength: [20, 55, 80],
	dexterity: [20, 55, 80],
	intelligence: [20, 55, 80],
	faith: [20, 55, 80],
	arcane: [20, 55, 80]
};

/** Renvoie un libellé court "OK", "soft cap (40)", "hard cap (60)". */
export function softCapStatus(stat: keyof CharacterStats, value: number): { label: string; level: 0 | 1 | 2 } {
	const caps = SOFT_CAPS[stat];
	if (!caps.length) return { label: 'OK', level: 0 };
	const hard = caps[caps.length - 1];
	if (value >= hard) return { label: `hard cap (${hard})`, level: 2 };
	const reachedSoft = caps.filter((c) => value >= c).pop();
	if (reachedSoft !== undefined) return { label: `soft cap (${reachedSoft})`, level: 1 };
	return { label: 'OK', level: 0 };
}

// ── Equip Load max selon Endurance (approximation communautaire) ──────
const EQUIP_POINTS: { end: number; load: number }[] = [
	{ end: 8, load: 45 },
	{ end: 15, load: 65 },
	{ end: 25, load: 76 },
	{ end: 50, load: 100 },
	{ end: 75, load: 130 },
	{ end: 99, load: 160 }
];

export function maxEquipLoad(endurance: number): number {
	if (endurance <= EQUIP_POINTS[0].end) return EQUIP_POINTS[0].load;
	if (endurance >= EQUIP_POINTS[EQUIP_POINTS.length - 1].end) return EQUIP_POINTS[EQUIP_POINTS.length - 1].load;
	for (let i = 1; i < EQUIP_POINTS.length; i++) {
		const a = EQUIP_POINTS[i - 1];
		const b = EQUIP_POINTS[i];
		if (endurance <= b.end) {
			const t = (endurance - a.end) / (b.end - a.end);
			return a.load + t * (b.load - a.load);
		}
	}
	return EQUIP_POINTS[EQUIP_POINTS.length - 1].load;
}

export type RollCategory = 'Light' | 'Medium' | 'Heavy' | 'Overload';
export function rollCategory(ratio: number): RollCategory {
	if (ratio < 0.3) return 'Light';
	if (ratio < 0.7) return 'Medium';
	if (ratio < 1.0) return 'Heavy';
	return 'Overload';
}

export const ROLL_COLOR: Record<RollCategory, string> = {
	Light: 'rgb(110 231 183 / 0.9)', // emerald
	Medium: 'rgb(200 169 81 / 0.9)', // gold
	Heavy: 'rgb(251 146 60 / 0.9)', // orange
	Overload: 'rgb(244 63 94 / 0.9)' // rose
};

// ── Mind → memory slots ───────────────────────────────────────────────
const MIND_TO_SLOTS: { min: number; slots: number }[] = [
	{ min: 0, slots: 0 },
	{ min: 15, slots: 1 },
	{ min: 17, slots: 2 },
	{ min: 19, slots: 3 },
	{ min: 21, slots: 4 },
	{ min: 24, slots: 5 },
	{ min: 27, slots: 6 },
	{ min: 30, slots: 7 },
	{ min: 33, slots: 8 },
	{ min: 37, slots: 9 },
	{ min: 41, slots: 10 }
];

export function memorySlotsFromMind(mind: number): number {
	let slots = 0;
	for (const t of MIND_TO_SLOTS) {
		if (mind >= t.min) slots = t.slots;
	}
	return slots;
}

// ── Niveau perso (approximation : level = sum(stats) - 79) ────────────
/** Niveau approximatif (somme des 8 stats - 79, soit la base à Lv. 1 toutes classes confondues). */
export function characterLevel(stats: CharacterStats): number {
	const sum =
		stats.vigor +
		stats.mind +
		stats.endurance +
		stats.strength +
		stats.dexterity +
		stats.intelligence +
		stats.faith +
		stats.arcane;
	return Math.max(1, sum - 79);
}

// ── Normalisation des noms de stat (abbréviations vs full names) ──────
const STAT_ALIASES: Record<string, keyof CharacterStats> = {
	Str: 'strength',
	Dex: 'dexterity',
	Int: 'intelligence',
	Fai: 'faith',
	Arc: 'arcane',
	Strength: 'strength',
	Dexterity: 'dexterity',
	Intelligence: 'intelligence',
	Faith: 'faith',
	Arcane: 'arcane',
	Vig: 'vigor',
	Mnd: 'mind',
	End: 'endurance',
	Vigor: 'vigor',
	Mind: 'mind',
	Endurance: 'endurance'
};

export function normalizeStatKey(name: string): keyof CharacterStats | null {
	return STAT_ALIASES[name] ?? null;
}
