import { test, expect } from '@playwright/test';

test('renders the themed token-contract Playground', async ({ page }) => {
  await page.goto('/');

  // Anchor on the heading role, not incidental copy, so wording tweaks don't
  // break the test — but the Playground must actually render its title.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Themeable token contract',
  );

  // The token contract is the deliverable: the swatch names the CSS custom
  // property the Playground overrides without rebuilding libs/ui.
  await expect(page.locator('.token-swatch')).toContainText('--ui-color-primary');
});
