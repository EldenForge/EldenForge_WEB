import { test, expect } from '@playwright/test';

test.describe('Explore page', () => {
	test('displays the Explore heading', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: /explore builds/i })).toBeVisible();
	});

	test('displays a search input for builds', async ({ page }) => {
		await page.goto('/');
		const searchInput = page.getByPlaceholder(/search by build name/i);
		await expect(searchInput).toBeVisible();
	});

	test('shows tri buttons Recent / Popular / Trending', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('button', { name: /recent/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /popular/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /trending/i })).toBeVisible();
	});

	test('applies the trending sort when clicked', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /trending/i }).click();
		// La classe active gold est appliquee
		const btn = page.getByRole('button', { name: /trending/i });
		await expect(btn).toHaveClass(/text-gold/);
	});

	test('shows a footer with copyright notice', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText(/BANDAI NAMCO/i)).toBeVisible();
	});
});
