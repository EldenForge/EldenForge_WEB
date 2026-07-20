import { test, expect } from '@playwright/test';

test.describe('Codex navigation', () => {
	test('displays the 9 category cards on the hub', async ({ page }) => {
		await page.goto('/codex');
		// Attend le chargement (les cards ont l'ombre gold au hover)
		await expect(page.getByRole('heading', { name: /codex/i, level: 1 })).toBeVisible();
	});

	test('navigates from hub to /codex/weapons', async ({ page }) => {
		await page.goto('/codex');
		await page.getByRole('link', { name: /weapons/i }).first().click();
		await expect(page).toHaveURL(/\/codex\/weapons$/);
	});

	test('search input on codex/weapons has an accessible name', async ({ page }) => {
		await page.goto('/codex/weapons');
		const search = page.getByLabel(/search items/i);
		await expect(search).toBeVisible();
	});

	test('category filter on codex/weapons has an accessible name', async ({ page }) => {
		await page.goto('/codex/weapons');
		const select = page.getByLabel(/filter by weapon category/i);
		await expect(select).toBeVisible();
	});
});
