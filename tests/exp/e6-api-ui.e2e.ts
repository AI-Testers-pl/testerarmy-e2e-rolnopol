import { expect } from 'e2e';
import { z } from 'zod';

import { test } from './fixtures.ts';

// E6 (e2e). Dane przez API, sprawdzenie w UI, i odwrotnie. Bliźniak: pw/tests/e6-api-ui.spec.ts.
test('E6 e2e: zwierzę utworzone przez API widać w UI', { session: 'demo', tags: ['e6', 'code'] }, async ({ app, browser, animals }) => {
  const n = 400 + Math.floor(Math.random() * 500);
  const animal = await animals.create('tortoise', n);
  await app.open('/staff-fields-main.html');
  await browser.locator('#animalsSearch').fill('tortoise');
  await expect(browser.locator(`.animal-card-${animal.id} .list-card-amount`)).toHaveText(String(n));
});

test('E6 e2e kod: pierwsza strona listy i suma zgadzają się z API', { session: 'demo', tags: ['e6', 'code'] }, async ({ app, browser, animals }) => {
  const backend = await animals.list();
  await app.open('/staff-fields-main.html');
  await expect(browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  // e2e nie ma locator.evaluateAll: zostaje browser.evaluate z selektorem w środku.
  const shown = await browser.evaluate(() =>
    [...document.querySelectorAll('#animalsList li.animal-card')].map((li) => ({
      id: Number(/animal-card-(\d+)/.exec(li.className)?.[1]),
      amount: Number(li.querySelector('.list-card-amount')?.textContent),
    })),
  );
  for (const row of shown) expect(row.amount).toBe(backend.find((a) => a.id === row.id)?.amount);
  const total = backend.reduce((sum, a) => sum + Number(a.amount), 0);
  await expect(browser.locator('#totalAnimals')).toHaveText(String(total));
});

// Wariant AI: model czyta listę z ekranu (bez znajomości DOM), kod porównuje z API.
const Rows = z.array(z.object({ type: z.string(), amount: z.number() }));

test('E6 e2e extract: pierwsza strona listy zgadza się z API', { session: 'demo', tags: ['e6', 'ai'] }, async ({ app, browser, agent, animals }) => {
  const backend = await animals.list();
  await app.open('/staff-fields-main.html');
  await expect(browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  const rows = await agent.extract('every animal group in the "Animals (groups)" list on the current page: its type and amount', { schema: Rows });
  console.log('extract:', JSON.stringify(rows));
  expect(rows.length).toBe(5);
  for (const row of rows) {
    expect(backend.some((a) => a.type === row.type.toLowerCase() && Number(a.amount) === row.amount)).toBe(true);
  }
});
