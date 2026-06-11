import { test, expect } from '@playwright/test';

// E2e owns only what emerges from real app composition: the page mounts and a
// gesture round-trips to a real Command (ADR 0010). Keyboard/typeahead/Escape
// mechanics are covered by the Select scenario stories, not re-tested here.
test('Playground composition: a Select gesture round-trips to a Command', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Select intent to Command',
  );

  const select = page.getByRole('combobox', { name: 'Project status' });

  await select.focus();
  await select.press('Enter');
  await select.press('ArrowDown');
  await select.press('Enter');

  await expect(page.locator('.command-output')).toContainText(
    'Command: change-status / in-progress',
  );
});
