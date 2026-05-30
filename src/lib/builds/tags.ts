export const TAG_GROUPS: { label: string; tags: string[] }[] = [
	{ label: 'Stats', tags: ['Strength', 'Dexterity', 'Intelligence', 'Faith', 'Arcane', 'Quality'] },
	{ label: 'Spells', tags: ['Sorceries', 'Incantations'] },
	{ label: 'Status / Damage', tags: ['Bleed', 'Poison', 'Frost', 'Lightning', 'Fire'] },
	{ label: 'Mode', tags: ['PvP', 'PvE', 'Boss'] },
	{ label: 'Difficulty', tags: ['Beginner', 'End-game', 'No-hit'] }
];

export const ALLOWED_TAGS: string[] = TAG_GROUPS.flatMap((g) => g.tags);
