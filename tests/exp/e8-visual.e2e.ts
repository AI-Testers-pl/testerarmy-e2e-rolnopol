import { expect, test } from 'e2e';

// E8 (e2e). Porównanie wizualne. Bliźniak: pw/tests/e8-visual.spec.ts.
// e2e ma toHaveScreenshot, ale tylko viewport: bez fullPage, clip, animations, scale (docs/migrate/playwright.mdx:210).
test('E8 e2e: ekran logowania', { tags: ['e8'] }, async ({ app, screen }) => {
  await app.open('/login.html');
  await expect(screen).toHaveScreenshot('login.png');
});
