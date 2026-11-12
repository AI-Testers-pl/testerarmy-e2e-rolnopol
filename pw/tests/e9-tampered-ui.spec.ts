import { expect, test } from './fixtures';

// E9 (Playwright). UI pokazuje złą kwotę: route.fetch() bierze prawdziwą odpowiedź i zmienia jedną liczbę.
// W e2e nie ma route.fetch(), tam trzeba pobrać odpowiedź osobno i podać ją przez fulfill.
test('E9 PW: UI vs API przy podmienionej kwocie', async ({ page, animals }) => {
  const real = await animals.list();
  await page.route('**/api/v1/animals', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    body.data[0].amount = Number(body.data[0].amount) + 9;
    await route.fulfill({ response, json: body });
  });
  await page.goto('/staff-fields-main.html');
  const cards = page.locator('#animalsList li.animal-card');
  await expect(cards.first()).toBeVisible();
  const shown = await cards.evaluateAll((lis) =>
    lis.map((li) => ({
      id: Number(/animal-card-(\d+)/.exec(li.className)?.[1]),
      amount: Number(li.querySelector('.list-card-amount')?.textContent),
    })),
  );
  for (const row of shown) expect(row.amount, `zwierzę ${row.id}`).toBe(real.find((a) => a.id === row.id)?.amount);
});
