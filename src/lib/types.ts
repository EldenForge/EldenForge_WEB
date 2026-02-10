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
	category: string; // "Helm" | "Chest Armor" | "Gauntlets" | "Leg Armor"
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

export interface BuildState {
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
}
