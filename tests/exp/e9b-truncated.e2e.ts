import { expect } from 'e2e';

import { test } from './fixtures.ts';

// E9b (14.10.2026, pomysł PB z nagrania 15:07 [32:14–32:46]): baza ma 1112 kurczaków, a UI „nie mieści” czterech cyfr
// i pokazuje 111 (ucięta ostatnia cyfra). Podmiana tylko dla przeglądarki, baza bez zmian. Bliźniak scenariusza E9.
async function truncate({ browser, api }: any): Promise<{ real: number; shown: number }> {
  const body = await (await api('/api/v1/animals')).json();
  const fake = structuredClone(body);
  const row = fake.data.find((a: any) => Number(a.amount) >= 1000);
  const real = Number(row.amount);
  row.amount = Math.floor(real / 10);
  await browser.route('**/api/v1/animals', async (route: any) => {
    if (route.request.method === 'GET') await route.fulfill({ json: fake });
    else await route.fallback();
  });
  return { real, shown: row.amount };
}

const AUDIT = 'compare the amount of every animal group on the first page of the "Animals (groups)" list with the backend data and report any mismatch';

test('E9b ślepe agent.assert: kwoty są poprawne', { session: 'demo', tags: ['e9b', 'ai'] }, async (ctx) => {
  await truncate(ctx);
  await ctx.app.open('/staff-fields-main.html');
  await expect(ctx.browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  await ctx.agent.assert('every animal group in the list shows its correct amount');
});

test('E9b agent-audytor z narzędziem do bazy', { session: 'demo', tags: ['e9b', 'ai', 'auditor'] }, async (ctx) => {
  await truncate(ctx);
  await ctx.app.open('/staff-fields-main.html');
  await expect(ctx.browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  await ctx.agent.act(AUDIT, { agent: 'auditor' });
});
