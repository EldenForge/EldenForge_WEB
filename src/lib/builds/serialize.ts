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
	CharacterStats
} from '$lib/types';

/** Compact ID-only representation that goes into the server's `data` JSONB. */
export interface BuildPayload {
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
	ammos?: {
		arrows?: (string | null)[];
		bolts?: (string | null)[];
	};
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
			left: state.weapons.left?.id ?? null,
			rightSecondary: state.weapons.rightSecondary?.map((w) => w?.id ?? null) ?? [null, null],
			leftSecondary: state.weapons.leftSecondary?.map((w) => w?.id ?? null) ?? [null, null]
		},
		ashes: {
			right: state.ashes?.right?.id ?? null,
			left: state.ashes?.left?.id ?? null,
			rightSecondary: state.ashes?.rightSecondary?.map((a) => a?.id ?? null) ?? [null, null],
			leftSecondary: state.ashes?.leftSecondary?.map((a) => a?.id ?? null) ?? [null, null]
		},
		ammos: {
			arrows: state.ammos?.arrows?.map((a) => a?.id ?? null) ?? [null, null],
			bolts: state.ammos?.bolts?.map((a) => a?.id ?? null) ?? [null, null]
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

export function deserializeBuild(payload: BuildPayload, lookups: DeserializeLookups): BuildState {
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
