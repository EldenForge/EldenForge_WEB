/**
 * Calcul de l'Attack Rating (AR) d'une arme Elden Ring.
 * Formule = erdb (MIT) : voir FORMULA.md. Données dans erdb_data.json.
 *
 *   AR_D = base_atk[D] * (1 + sum_A scaling[A] * graph[graph_ids[D]][stat[A]] * ratio[A][D])
 *
 * Pour les armes connues d'erdb : scaling floats + graph_ids + correction matrix précis.
 * Pour les armes DLC (non répertoriées chez erdb 1.10) : fallback graph 0 + letter_multipliers
 * + heuristique « correction true si scaling présent et base_atk > 0 ».
 */
import erdb from './erdb_data.json';
import type { UpgradeRow } from '$lib/api/items';

export type DamageType = 'phy' | 'mag' | 'fir' | 'lit' | 'hol';
export type ScalingStat = 'Str' | 'Dex' | 'Int' | 'Fai' | 'Arc';

export interface CharStats {
	strength: number;
	dexterity: number;
	intelligence: number;
	faith: number;
	arcane: number;
}

export interface AR {
	phy: number;
	mag: number;
	fir: number;
	lit: number;
	hol: number;
	total: number;
	contributions: Record<ScalingStat, number>; // pour debug/affichage
}

const TYPES: DamageType[] = ['phy', 'mag', 'fir', 'lit', 'hol'];
const STATS: ScalingStat[] = ['Str', 'Dex', 'Int', 'Fai', 'Arc'];

const SRC_KEY: Record<DamageType, keyof UpgradeRow['attack']> = {
	phy: 'Phy',
	mag: 'Mag',
	fir: 'Fire',
	lit: 'Ligt',
	hol: 'Holy'
};

const STAT_TO_CHAR: Record<ScalingStat, keyof CharStats> = {
	Str: 'strength',
	Dex: 'dexterity',
	Int: 'intelligence',
	Fai: 'faith',
	Arc: 'arcane'
};

const DEFAULT_AEC_ID = '10000'; // matrix « épée standard physique » (fallback)

// Casts pour exploiter le JSON sans définir tous les types
type ErdbAEC = Record<
	DamageType,
	{
		ratio: Record<ScalingStat, number>;
		correction: Record<ScalingStat, boolean>;
		override?: Partial<Record<ScalingStat, number>>;
	}
>;
type ErdbWeapon = {
	id: number;
	attackElementCorrectId: number;
	reinforceTypeId: number;
	graph_ids: Record<DamageType, number>;
	base_atk: Record<DamageType, number>;
	scaling: Record<ScalingStat, number>;
};

const ERDB_WEAPONS: Record<string, ErdbWeapon> = (erdb as unknown as { weapons: Record<string, ErdbWeapon> }).weapons;
const ERDB_GRAPHS: Record<string, number[]> = (erdb as unknown as { correction_graphs: Record<string, number[]> }).correction_graphs;
const ERDB_AEC: Record<string, ErdbAEC> = (erdb as unknown as { attack_element_correct: Record<string, ErdbAEC> }).attack_element_correct;
const LETTER_MULT: Record<string, number> = (erdb as unknown as { letter_multipliers: Record<string, number> }).letter_multipliers;

function clamp(v: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, v));
}

export function maxUpgradeLevel(rows: UpgradeRow[]): number {
	return rows.reduce((m, r) => Math.max(m, r.level), 0);
}

export function pickUpgradeRow(rows: UpgradeRow[], level: number): UpgradeRow | null {
	if (!rows.length) return null;
	// Exact match, sinon le plus proche inférieur
	const sorted = [...rows].sort((a, b) => a.level - b.level);
	let best: UpgradeRow | null = null;
	for (const r of sorted) {
		if (r.level <= level) best = r;
		else break;
	}
	return best ?? sorted[0];
}

export function computeAR(weaponName: string, upgrade: UpgradeRow, stats: CharStats): AR {
	const key = (weaponName || '').toLowerCase().trim();
	const erdbW = ERDB_WEAPONS[key];
	const aecId = String(erdbW?.attackElementCorrectId ?? DEFAULT_AEC_ID);
	const aec = ERDB_AEC[aecId] ?? ERDB_AEC[DEFAULT_AEC_ID];
	const graphIds = erdbW?.graph_ids ?? { phy: 0, mag: 0, fir: 0, lit: 0, hol: 0 };

	// Scaling : floats erdb si dispo, sinon letter_multipliers (fallback DLC)
	const scalingValue: Record<ScalingStat, number> = { Str: 0, Dex: 0, Int: 0, Fai: 0, Arc: 0 };
	for (const A of STATS) {
		if (erdbW && erdbW.scaling[A] != null) {
			scalingValue[A] = erdbW.scaling[A];
		} else {
			const letter = upgrade.scaling[A];
			scalingValue[A] = letter ? (LETTER_MULT[letter] ?? 0) : 0;
		}
	}

	const contributions: Record<ScalingStat, number> = { Str: 0, Dex: 0, Int: 0, Fai: 0, Arc: 0 };
	const ar: AR = { phy: 0, mag: 0, fir: 0, lit: 0, hol: 0, total: 0, contributions };

	for (const D of TYPES) {
		const baseAtk = upgrade.attack[SRC_KEY[D]] ?? 0;
		if (baseAtk <= 0) {
			ar[D] = 0;
			continue;
		}
		const corrMap = aec[D]?.correction ?? ({} as Record<ScalingStat, boolean>);
		const ratioMap = aec[D]?.ratio ?? ({} as Record<ScalingStat, number>);

		let contribution = 0;
		for (const A of STATS) {
			const erdbCorr = corrMap[A] === true;
			// Fallback DLC : si arme non répertoriée chez erdb et scaling présent dans le scrap,
			// on active la correction sur les damage types non nuls (heuristique).
			const fallback = !erdbW && upgrade.scaling[A] != null;
			if (!erdbCorr && !fallback) continue;

			const sv = clamp(stats[STAT_TO_CHAR[A]] ?? 1, 0, 149);
			const graph = ERDB_GRAPHS[String(graphIds[D] ?? 0)] ?? ERDB_GRAPHS['0'];
			const gv = graph[Math.round(sv)] ?? 0;
			const ratio = ratioMap[A] ?? 1.0;

			const c = scalingValue[A] * gv * ratio;
			contribution += c;
			contributions[A] += baseAtk * c; // contribution en AR de ce stat (cumulée tous types)
		}

		ar[D] = baseAtk * (1 + contribution);
	}

	ar.total =
		Math.floor(ar.phy) + Math.floor(ar.mag) + Math.floor(ar.fir) + Math.floor(ar.lit) + Math.floor(ar.hol);
	return ar;
}

export const DAMAGE_LABEL: Record<DamageType, string> = {
	phy: 'Phy',
	mag: 'Mag',
	fir: 'Fire',
	lit: 'Ligt',
	hol: 'Holy'
};

export const DAMAGE_COLOR: Record<DamageType, string> = {
	phy: 'rgb(200 169 81 / 0.85)',
	mag: 'rgb(125 168 232 / 0.85)',
	fir: 'rgb(239 108 80 / 0.85)',
	lit: 'rgb(253 216 53 / 0.85)',
	hol: 'rgb(255 249 196 / 0.85)'
};
