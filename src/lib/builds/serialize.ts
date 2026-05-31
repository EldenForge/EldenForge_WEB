import type {
	Armor,
	Talisman,
	Weapon,
	Spell,
	Sorcery,
	Incantation,
	Spirit,
	AshOfWar,
	Ammo,
	BuildState,
	Loadout,
	CharacterStats
} from '$lib/types';

/** Une page d'equipement serialisee (ids seulement, pas les objets entiers). */
export interface LoadoutPayload {
	name: string;
	stats: CharacterStats;
	armor: { head: string | null; chest: string | null; hands: string | null; legs: string | null };
	talismans: (string | null)[];
	weapons: {
		right: string | null;
		left: string | null;
		rightSecondary?: (string | null)[];
		leftSecondary?: (string | null)[];
	};
	ashes?: {
		right: string | null;
		left: string | null;
		rightSecondary?: (string | null)[];
		leftSecondary?: (string | null)[];
	};
	ammos?: { arrows?: (string | null)[]; bolts?: (string | null)[] };
	spells: (string | null)[];
	spirit: string | null;
	guide: string;
}

/** Payload v2 : plusieurs pages. */
export interface BuildPayloadV2 {
	v: 2;
	loadouts: LoadoutPayload[];
	activeIndex: number;
}

/** Payload v1 historique : 1 seule page, champs au top-level (sans `name`/`v`). */
export interface BuildPayloadV1 {
	stats: CharacterStats;
	armor: { head: string | null; chest: string | null; hands: string | null; legs: string | null };
	talismans: (string | null)[];
	weapons: {
		right: string | null;
		left: string | null;
		rightSecondary?: (string | null)[];
		leftSecondary?: (string | null)[];
	};
	ashes?: {
		right: string | null;
		left: string | null;
		rightSecondary?: (string | null)[];
		leftSecondary?: (string | null)[];
	};
	ammos?: { arrows?: (string | null)[]; bolts?: (string | null)[] };
	spells: (string | null)[];
	spirit: string | null;
	guide: string;
}

export type BuildPayload = BuildPayloadV2 | BuildPayloadV1;

function serializeLoadout(l: Loadout): LoadoutPayload {
	return {
		name: l.name,
		stats: l.stats,
		armor: {
			head: l.armor.head?.id ?? null,
			chest: l.armor.chest?.id ?? null,
			hands: l.armor.hands?.id ?? null,
			legs: l.armor.legs?.id ?? null
		},
		talismans: l.talismans.map((t) => t?.id ?? null),
		weapons: {
			right: l.weapons.right?.id ?? null,
			left: l.weapons.left?.id ?? null,
			rightSecondary: l.weapons.rightSecondary?.map((w) => w?.id ?? null) ?? [null, null],
			leftSecondary: l.weapons.leftSecondary?.map((w) => w?.id ?? null) ?? [null, null]
		},
		ashes: {
			right: l.ashes?.right?.id ?? null,
			left: l.ashes?.left?.id ?? null,
			rightSecondary: l.ashes?.rightSecondary?.map((a) => a?.id ?? null) ?? [null, null],
			leftSecondary: l.ashes?.leftSecondary?.map((a) => a?.id ?? null) ?? [null, null]
		},
		ammos: {
			arrows: l.ammos?.arrows?.map((a) => a?.id ?? null) ?? [null, null],
			bolts: l.ammos?.bolts?.map((a) => a?.id ?? null) ?? [null, null]
		},
		spells: l.spells.map((s) => s?.id ?? null),
		spirit: l.spirit?.id ?? null,
		guide: l.guide
	};
}

export function serializeBuild(state: BuildState): BuildPayloadV2 {
	return {
		v: 2,
		loadouts: state.loadouts.map(serializeLoadout),
		activeIndex: state.activeIndex
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
	ammos?: Ammo[];
}

function findById<T extends { id: string }>(items: T[], id: string | null): T | null {
	if (!id) return null;
	return items.find((i) => i.id === id) ?? null;
}

function padTo2<T>(arr: (T | null)[] | undefined): (T | null)[] {
	const a = arr ?? [];
	return [a[0] ?? null, a[1] ?? null];
}

function deserializeLoadout(payload: LoadoutPayload | BuildPayloadV1, lookups: DeserializeLookups, defaultName: string): Loadout {
	const allSpells: Spell[] = [...lookups.sorceries, ...lookups.incantations];
	const allLeftHand: Weapon[] = [...lookups.weapons, ...lookups.shields];
	const ashesPool: AshOfWar[] = lookups.ashes_of_war ?? [];
	const ammosPool: Ammo[] = lookups.ammos ?? [];
	const rsIds = padTo2<string>(payload.weapons.rightSecondary);
	const lsIds = padTo2<string>(payload.weapons.leftSecondary);
	const rsAshIds = padTo2<string>(payload.ashes?.rightSecondary);
	const lsAshIds = padTo2<string>(payload.ashes?.leftSecondary);
	const arrIds = padTo2<string>(payload.ammos?.arrows);
	const boltIds = padTo2<string>(payload.ammos?.bolts);
	return {
		name: 'name' in payload && payload.name ? payload.name : defaultName,
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
			left: findById(allLeftHand, payload.weapons.left),
			rightSecondary: rsIds.map((id) => findById(lookups.weapons, id)),
			leftSecondary: lsIds.map((id) => findById(allLeftHand, id))
		},
		ashes: {
			right: findById(ashesPool, payload.ashes?.right ?? null),
			left: findById(ashesPool, payload.ashes?.left ?? null),
			rightSecondary: rsAshIds.map((id) => findById(ashesPool, id)),
			leftSecondary: lsAshIds.map((id) => findById(ashesPool, id))
		},
		ammos: {
			arrows: arrIds.map((id) => findById(ammosPool, id)),
			bolts: boltIds.map((id) => findById(ammosPool, id))
		},
		spells: payload.spells.map((id) => findById(allSpells, id)),
		spirit: findById(lookups.spirits, payload.spirit),
		guide: payload.guide
	};
}

function isV2(p: BuildPayload): p is BuildPayloadV2 {
	return (p as BuildPayloadV2).v === 2 && Array.isArray((p as BuildPayloadV2).loadouts);
}

export function deserializeBuild(payload: BuildPayload, lookups: DeserializeLookups): BuildState {
	if (isV2(payload)) {
		const loadouts = payload.loadouts.map((p, i) => deserializeLoadout(p, lookups, `Page ${i + 1}`));
		if (loadouts.length === 0) loadouts.push(deserializeLoadout({} as BuildPayloadV1, lookups, 'Main'));
		const activeIndex = Math.max(0, Math.min(loadouts.length - 1, payload.activeIndex ?? 0));
		return { loadouts, activeIndex };
	}
	// v1 : un seul loadout au top-level, on l'enveloppe.
	return { loadouts: [deserializeLoadout(payload, lookups, 'Main')], activeIndex: 0 };
}
