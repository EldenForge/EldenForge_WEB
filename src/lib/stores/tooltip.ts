import { writable } from 'svelte/store';

export type AnyItem = Record<string, unknown> & { name: string; image?: string | null };

interface TooltipState {
	visible: boolean;
	x: number;
	y: number;
	item: AnyItem | null;
}

function createTooltipStore() {
	const { subscribe, set, update } = writable<TooltipState>({
		visible: false,
		x: 0,
		y: 0,
		item: null
	});

	return {
		subscribe,
		show: (item: AnyItem, x: number, y: number) => set({ visible: true, x, y, item }),
		move: (x: number, y: number) => update((s) => ({ ...s, x, y })),
		hide: () => update((s) => ({ ...s, visible: false }))
	};
}

export const tooltipStore = createTooltipStore();
