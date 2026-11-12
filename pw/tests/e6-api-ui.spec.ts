import { expect, test } from './fixtures';

// E6 (Playwright). Dane przez API, sprawdzenie w UI, i odwrotnie: UI musi zgadzać się z API.
test('E6 PW: zwierzę utworzone przez API widać w UI', async ({ page, animals }) => {
  const n = 400 + Math.floor(Math.random() * 500);
  const animal = await animals.create('tortoise', n);
  await page.goto('/staff-fields-main.html');
  await page.locator('#animalsSearch').fill('tortoise');
  await expect(page.locator(`.animal-card-${animal.id} .list-card-amount`)).toHaveText(String(n));
});

test('E6 PW: pierwsza strona listy i suma zgadzają się z API', async ({ page, animals }) => {
  const backend = await animals.list();
  await page.goto('/staff-fields-main.html');
  const cards = page.locator('#animalsList li.animal-card');
  await expect(cards.first()).toBeVisible();
  const shown = await cards.evaluateAll((lis) =>
    lis.map((li) => ({
      id: Number(/animal-card-(\d+)/.exec(li.className)?.[1]),
      amount: Number(li.querySelector('.list-card-amount')?.textContent),
    })),
  );
  for (const row of shown) {
    expect.soft(row.amount, `zwierzę ${row.id}`).toBe(backend.find((a) => a.id === row.id)?.amount);
  }
  const total = backend.reduce((sum, a) => sum + Number(a.amount), 0);
  await expect(page.locator('#totalAnimals')).toHaveText(String(total));
});
