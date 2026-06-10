import { test, expect } from '@playwright/test';

test('maps keyboard Select intent to a Command', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Select intent to Command',
  );

  const select = page.getByRole('combobox', { name: 'Project status' });

  await select.focus();
  await select.press('Enter');
  await expect(select).toHaveAttribute('aria-expanded', 'true');
  await select.press('ArrowDown');
  await select.press('Enter');
  await expect(page.locator('.command-output')).toContainText(
    'Command: change-status / in-progress',
  );

  await select.press('Enter');
  await select.press('d');
  await expect(page.locator('.command-output')).toContainText(
    'Command: change-status / done',
  );

  await select.press('Enter');
  await select.press('Escape');
  await expect(select).toHaveAttribute('aria-expanded', 'false');
});
