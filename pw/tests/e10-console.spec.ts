import { expect, test } from './fixtures';

// E10 (Playwright). Błędy JS i console.error na głównych stronach. e2e nie ma page.on('console'/'pageerror').
const PAGES = ['/', '/staff-fields-main.html', '/financial.html', '/marketplace.html', '/alerts.html', '/profile.html', '/docs.html', '/rolnopolmap.html'];

for (const path of PAGES) {
  test(`E10 PW: brak błędów JS na ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}
