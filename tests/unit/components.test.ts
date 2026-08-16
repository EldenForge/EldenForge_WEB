import { render, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import IntentBadge from '$lib/components/IntentBadge.svelte';
import CodexCard from '$lib/components/CodexCard.svelte';
import SlotButton from '$lib/components/SlotButton.svelte';

afterEach(() => cleanup());

describe('IntentBadge', () => {
	it('renders PvE with correct label and aria', () => {
		const { getByText, container } = render(IntentBadge, { props: { intent: 'pve' } });
		expect(getByText('PvE')).toBeTruthy();
		const span = container.querySelector('[aria-label]');
		expect(span?.getAttribute('aria-label')).toBe('PvE mode, player versus environment');
	});

	it('renders Co-op label for coop intent', () => {
		const { getByText } = render(IntentBadge, { props: { intent: 'coop' } });
		expect(getByText('Co-op')).toBeTruthy();
	});

	it('renders PvP label for pvp intent', () => {
		const { getByText } = render(IntentBadge, { props: { intent: 'pvp' } });
		expect(getByText('PvP')).toBeTruthy();
	});

	it('applies md size classes when size=md', () => {
		const { container } = render(IntentBadge, { props: { intent: 'pve', size: 'md' } });
		const span = container.querySelector('span');
		expect(span?.className).toContain('text-xs');
	});
});

describe('CodexCard', () => {
	it('renders name as h3', () => {
		const { getByText } = render(CodexCard, { props: { name: 'Uchigatana' } });
		const h3 = getByText('Uchigatana');
		expect(h3.tagName).toBe('H3');
	});

	it('renders subtitle when provided', () => {
		const { getByText } = render(CodexCard, {
			props: { name: 'Uchigatana', subtitle: 'Katana' }
		});
		expect(getByText('Katana')).toBeTruthy();
	});

	it('renders badges list', () => {
		const { getByText } = render(CodexCard, {
			props: { name: 'Uchigatana', badges: ['DLC', 'Rare'] }
		});
		expect(getByText('DLC')).toBeTruthy();
		expect(getByText('Rare')).toBeTruthy();
	});

	it('renders See builds link when findBuildsHref provided', () => {
		const { container } = render(CodexCard, {
			props: { name: 'Uchigatana', findBuildsHref: '/?item=Uchigatana' }
		});
		const link = container.querySelector('a[href="/?item=Uchigatana"]');
		expect(link).toBeTruthy();
	});

	it('omits subtitle paragraph when subtitle is undefined', () => {
		const { container } = render(CodexCard, { props: { name: 'Uchigatana' } });
		expect(container.querySelectorAll('p').length).toBe(0);
	});
});

describe('SlotButton', () => {
	it('exposes aria-label indicating empty slot when itemName is null', () => {
		const { container } = render(SlotButton, {
			props: { slotLabel: 'Right Hand', itemName: null }
		});
		const btn = container.querySelector('button');
		expect(btn?.getAttribute('aria-label')).toContain('empty');
		expect(btn?.getAttribute('aria-label')).toContain('Right Hand');
	});

	it('exposes aria-label with equipped item name', () => {
		const { container } = render(SlotButton, {
			props: { slotLabel: 'Right Hand', itemName: 'Uchigatana' }
		});
		const btn = container.querySelector('button');
		const label = btn?.getAttribute('aria-label') ?? '';
		expect(label).toContain('Right Hand');
		expect(label).toContain('Uchigatana');
	});
});
