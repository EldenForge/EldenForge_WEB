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
	[key: string]: unknown;
}

export interface Talisman {
	id: string;
	name: string;
	image: string;
	description: string;
	effect: string;
	[key: string]: unknown;
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
	[key: string]: unknown;
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
	[key: string]: unknown;
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
	[key: string]: unknown;
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
	[key: string]: unknown;
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

export interface AshOfWar {
	id: string;
	name: string;
	image: string;
	affinity: string;
	skill: string;
	description: string;
	dlc?: string | number;
	[key: string]: unknown;
}

export interface Ammo {
	id: string;
	name: string;
	image: string;
	description: string;
	type?: string;
	attackPower?: unknown;
	passive?: string;
	[key: string]: unknown;
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
		rightSecondary: (Weapon | null)[]; // 2 slots
		leftSecondary: (Weapon | null)[];  // 2 slots
	};
	ashes: {
		right: AshOfWar | null;
		left: AshOfWar | null;
		rightSecondary: (AshOfWar | null)[]; // 2 slots
		leftSecondary: (AshOfWar | null)[];  // 2 slots
	};
	ammos: {
		arrows: (Ammo | null)[]; // 2 slots
		bolts: (Ammo | null)[];  // 2 slots
	};
	spells: (Spell | null)[];
	spirit: Spirit | null;
	guide: string;
}
