import { expect } from 'e2e';
import { z } from 'zod';

import { type Animal, test } from './fixtures.ts';

// E9 (e2e). UI pokazuje złą kwotę (podmieniona odpowiedź GET /api/v1/animals), API i baza mówią prawdę.
// Kto to złapie: kod (UI vs API), agent.extract + kod, „ślepe” agent.assert, agent-audytor z narzędziem do bazy?
// e2e nie ma route.fetch(): prawdziwą odpowiedź pobieramy sami (fixture api) i podajemy zmienioną przez fulfill.
async function tamper({ browser, api }: any): Promise<{ real: Animal[]; fakeId: number }> {
  const body = await (await api('/api/v1/animals')).json();
  const real: Animal[] = body.data;
  const fake = structuredClone(body);
  fake.data[0].amount = Number(fake.data[0].amount) + 9; // chicken 101 → 110 na pierwszej stronie
  await browser.route('**/api/v1/animals', async (route: any) => {
    if (route.request.method === 'GET') await route.fulfill({ json: fake });
    else await route.fallback();
  });
  return { real, fakeId: fake.data[0].id };
}

test('E9 kod: UI vs API', { session: 'demo', tags: ['e9', 'code'] }, async (ctx) => {
  const { real } = await tamper(ctx);
  await ctx.app.open('/staff-fields-main.html');
  await expect(ctx.browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  const shown = await ctx.browser.evaluate(() =>
    [...document.querySelectorAll('#animalsList li.animal-card')].map((li) => ({
      id: Number(/animal-card-(\d+)/.exec(li.className)?.[1]),
      amount: Number(li.querySelector('.list-card-amount')?.textContent),
    })),
  );
  for (const row of shown) expect(row.amount).toBe(real.find((a) => a.id === row.id)?.amount);
});

const Rows = z.array(z.object({ type: z.string(), amount: z.number() }));

test('E9 extract + kod: UI vs API', { session: 'demo', tags: ['e9', 'ai'] }, async (ctx) => {
  const { real } = await tamper(ctx);
  await ctx.app.open('/staff-fields-main.html');
  await expect(ctx.browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  const rows = await ctx.agent.extract('every animal group in the "Animals (groups)" list on the current page: its type and amount', { schema: Rows });
  for (const row of rows) {
    expect(real.some((a) => a.type === row.type.toLowerCase() && Number(a.amount) === row.amount), `${row.type} ${row.amount}`).toBe(true);
  }
});

test('E9 ślepe agent.assert: kwoty są poprawne', { session: 'demo', tags: ['e9', 'ai'] }, async (ctx) => {
  await tamper(ctx);
  await ctx.app.open('/staff-fields-main.html');
  await expect(ctx.browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  await ctx.agent.assert('every animal group in the list shows its correct amount');
});

test('E9 agent-audytor z narzędziem do bazy', { session: 'demo', tags: ['e9', 'ai', 'auditor'] }, async (ctx) => {
  await tamper(ctx);
  await ctx.app.open('/staff-fields-main.html');
  await expect(ctx.browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  await ctx.agent.act('compare the amount of every animal group on the first page of the "Animals (groups)" list with the backend data and report any mismatch', { agent: 'auditor' });
});

// Kontrola: to samo bez manipulacji. Audytor nie powinien zgłaszać różnic.
test('E9 agent-audytor kontrola (UI poprawne)', { session: 'demo', tags: ['e9-control'] }, async (ctx) => {
  await ctx.app.open('/staff-fields-main.html');
  await expect(ctx.browser.locator('#animalsList li.animal-card').first()).toBeVisible();
  await ctx.agent.act('compare the amount of every animal group on the first page of the "Animals (groups)" list with the backend data and report any mismatch', { agent: 'auditor' });
});
