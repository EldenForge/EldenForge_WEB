import { test, expect } from '@playwright/test';

test.describe('Accessibility landmarks', () => {
	test('home page has skip link visible on focus', async ({ page }) => {
		await page.goto('/');
		// Tab focuses the skip link (usually the first focusable element)
		await page.keyboard.press('Tab');
		const skip = page.getByRole('link', { name: /aller au contenu principal/i });
		await expect(skip).toBeFocused();
	});

	test('skip link targets an element with id="main"', async ({ page }) => {
		await page.goto('/');
		const skip = page.getByRole('link', { name: /aller au contenu principal/i });
		await expect(skip).toHaveAttribute('href', '#main');
		await expect(page.locator('#main')).toBeVisible();
	});

	test('layout has proper landmarks (banner + main + contentinfo)', async ({ page }) => {
		await page.goto('/');
		// nav (banner-like) et main sont presents
		await expect(page.locator('nav')).toBeVisible();
		await expect(page.locator('main#main')).toBeVisible();
		await expect(page.locator('footer')).toBeVisible();
	});

	test('page title is set on Explore', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/elden forge/i);
	});

	test('page title is set on Codex', async ({ page }) => {
		await page.goto('/codex');
		await expect(page).toHaveTitle(/codex/i);
	});
});
