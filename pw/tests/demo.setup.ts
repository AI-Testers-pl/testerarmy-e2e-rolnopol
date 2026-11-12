import { expect, test as setup } from '@playwright/test';

import { DEMO_STATE } from '../playwright.config';

// Logowanie raz na przebieg, sesja do pliku (odpowiednik test.setup + session.save w e2e).
setup('logowanie jako demo', async ({ page }) => {
  await page.goto('/login.html');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill(process.env.ROLNOPOL_PASSWORD ?? 'demo123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.context().storageState({ path: DEMO_STATE });
});
