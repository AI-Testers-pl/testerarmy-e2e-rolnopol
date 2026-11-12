import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// E10 (e2e). Błędy JS i console.error. e2e nie ma page.on('console'/'pageerror') (docs/migrate/playwright.mdx:260),
// więc init script zbiera je do window.__errors, a test odczytuje je przez browser.evaluate. Bliźniak: pw/tests/e10-console.spec.ts.
const PAGES = ['/', '/staff-fields-main.html', '/financial.html', '/marketplace.html', '/alerts.html', '/profile.html', '/docs.html', '/rolnopolmap.html'];

for (const path of PAGES) {
  test(`E10 e2e: brak błędów JS na ${path}`, { session: 'demo', tags: ['e10'] }, async ({ app, browser }) => {
    await browser.addInitScript(() => {
      const errors: string[] = [];
      (window as any).__errors = errors;
      window.addEventListener('error', (e) => errors.push(`pageerror: ${e.message}`));
      window.addEventListener('unhandledrejection', (e) => errors.push(`unhandledrejection: ${String(e.reason)}`));
      const original = console.error;
      console.error = (...args: unknown[]) => { errors.push(`console: ${args.map(String).join(' ')}`); original(...args); };
    });
    await app.open(path);
    await expect(browser.locator('body')).toBeVisible();
    await expect.poll(() => browser.evaluate(() => document.readyState)).toBe('complete');
    expect(await browser.evaluate(() => (window as any).__errors)).toEqual([]);
  });
}

// Kontrola, że mechanizm w ogóle łapie błąd: strona sama rzuca wyjątek.
test('E10 e2e: kontrola – wstrzyknięty błąd jest wykryty', { session: 'demo', tags: ['e10'] }, async ({ app, browser }) => {
  await browser.addInitScript(() => {
    const errors: string[] = [];
    (window as any).__errors = errors;
    window.addEventListener('error', (e) => errors.push(`pageerror: ${e.message}`));
    setTimeout(() => { throw new Error('celowy błąd E10'); }, 0);
  });
  await app.open('/');
  await expect.poll(() => browser.evaluate(() => (window as any).__errors.length)).toBe(1);
});
