import { expect, test } from '@playwright/test';

// E8 (Playwright). Porównanie wizualne: ekran logowania (viewport) i cała strona główna (fullPage, czego e2e nie ma).
test.use({ storageState: { cookies: [], origins: [] } });

test('E8 PW: ekran logowania', async ({ page }) => {
  await page.goto('/login.html');
  await expect(page).toHaveScreenshot('login.png');
});

test('E8 PW: cała strona główna z maską', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('home-full.png', { fullPage: true, mask: [page.locator('footer')], maxDiffPixelRatio: 0.01 });
});
