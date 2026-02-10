export interface StatEntry {
	name: string;
	amount: number;
}

export interface ScalesWith {
	name: string;
	scaling: string;
}

export interface Armor {
	id: string;
	name: string;
	image: string;
	description: string;
	category: string;
	dmgNegation: StatEntry[];
	resistance: StatEntry[];
	weight: number;
}

export interface Talisman {
	id: string;
	name: string;
	image: string;
	description: string;
	effect: string;
}

export interface Weapon {
	id: string;
	name: string;
	image: string;
	description: string;
	attack: StatEntry[];
	defence: StatEntry[];
	scalesWith: ScalesWith[];
	requiredAttributes: StatEntry[];
	category: string;
	weight: number;
}

export type Shield = Weapon;

export interface Sorcery {
	id: string;
	name: string;
	image: string;
	description: string;
	type: string;
	cost: number;
	slots: number;
	effects: string;
	requires: StatEntry[];
}

export interface Incantation {
	id: string;
	name: string;
	image: string;
	description: string;
	type: string;
	cost: number;
	slots: number;
	effects: string;
	requires: StatEntry[];
}

export type Spell = Sorcery | Incantation;

export interface Spirit {
	id: string;
	name: string;
	image: string;
	description: string;
	fpCost: number;
	hpCost: number;
	effect: string;
}

export interface CharacterStats {
	vigor: number;
	mind: number;
	endurance: number;
	strength: number;
	dexterity: number;
	intelligence: number;
	faith: number;
	arcane: number;
}

export interface BuildState {
	stats: CharacterStats;
	armor: {
		head: Armor | null;
		chest: Armor | null;
		hands: Armor | null;
		legs: Armor | null;
	};
	talismans: (Talisman | null)[];
	weapons: {
		right: Weapon | null;
		left: Weapon | null;
	};
	spells: (Spell | null)[];
	spirit: Spirit | null;
}
