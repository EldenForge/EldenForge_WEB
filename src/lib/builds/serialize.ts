import type {
	Armor,
	Talisman,
	Weapon,
	Spell,
	Sorcery,
	Incantation,
	Spirit,
	AshOfWar,
	BuildState,
	CharacterStats
} from '$lib/types';

/** Compact ID-only representation that goes into the server's `data` JSONB. */
export interface BuildPayload {
	stats: CharacterStats;
	armor: { head: string | null; chest: string | null; hands: string | null; legs: string | null };
	talismans: (string | null)[];
	weapons: { right: string | null; left: string | null };
	ashes?: { right: string | null; left: string | null };
	spells: (string | null)[];
	spirit: string | null;
	guide: string;
}

export function serializeBuild(state: BuildState): BuildPayload {
	return {
		stats: state.stats,
		armor: {
			head: state.armor.head?.id ?? null,
			chest: state.armor.chest?.id ?? null,
			hands: state.armor.hands?.id ?? null,
			legs: state.armor.legs?.id ?? null
		},
		talismans: state.talismans.map((t) => t?.id ?? null),
		weapons: {
			right: state.weapons.right?.id ?? null,
			left: state.weapons.left?.id ?? null
		},
		ashes: {
			right: state.ashes?.right?.id ?? null,
			left: state.ashes?.left?.id ?? null
		},
		spells: state.spells.map((s) => s?.id ?? null),
		spirit: state.spirit?.id ?? null,
		guide: state.guide
	};
}

export interface DeserializeLookups {
	armors: Armor[];
	talismans: Talisman[];
	weapons: Weapon[];
	shields: Weapon[];
	sorceries: Sorcery[];
	incantations: Incantation[];
	spirits: Spirit[];
	ashes_of_war?: AshOfWar[];
}

function findById<T extends { id: string }>(items: T[], id: string | null): T | null {
	if (!id) return null;
	return items.find((i) => i.id === id) ?? null;
}

export function deserializeBuild(payload: BuildPayload, lookups: DeserializeLookups): BuildState {
	const allSpells: Spell[] = [...lookups.sorceries, ...lookups.incantations];
	const allLeftHand: Weapon[] = [...lookups.weapons, ...lookups.shields];
	const ashesPool: AshOfWar[] = lookups.ashes_of_war ?? [];
	return {
		stats: payload.stats,
		armor: {
			head: findById(lookups.armors, payload.armor.head),
			chest: findById(lookups.armors, payload.armor.chest),
			hands: findById(lookups.armors, payload.armor.hands),
			legs: findById(lookups.armors, payload.armor.legs)
		},
		talismans: payload.talismans.map((id) => findById(lookups.talismans, id)),
		weapons: {
			right: findById(lookups.weapons, payload.weapons.right),
			left: findById(allLeftHand, payload.weapons.left)
		},
		ashes: {
			right: findById(ashesPool, payload.ashes?.right ?? null),
			left: findById(ashesPool, payload.ashes?.left ?? null)
		},
		spells: payload.spells.map((id) => findById(allSpells, id)),
		spirit: findById(lookups.spirits, payload.spirit),
		guide: payload.guide
	};
}
