import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
	test('opens the login modal from the Login button', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /login/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('modal has a proper dialog role and aria-modal', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /login/i }).click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	test('closes the modal on Escape key', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /login/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();
	});

	test('shows an error message when logging in with wrong credentials', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /login/i }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel(/email/i).first().fill('nonexistent@example.local');
		await dialog.getByLabel(/password/i).first().fill('wrongpassword');
		await dialog.getByRole('button', { name: /^log in$|^sign in$|^login$/i }).click();
		// L'alerte doit apparaitre (role alert / aria-live)
		await expect(dialog.locator('[role="alert"], [aria-live]').first()).toBeVisible({ timeout: 5000 });
	});
});
