import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// E7 (e2e). Zapis zwierzęcia kończy się 500 (browser.route zamiast chaos engine). Bliźniak: pw/tests/e7-mock-500.spec.ts.
// W Rolnopolu id="animalMessage" jest dwa razy: błąd trafia pod listę (za modalem), a komunikat w modalu zostaje pusty.
// Pytanie: kto zauważy, że użytkownik nie widzi błędu? Kod czy agent.assert (drzewo / screenshot)?
const ERROR_SEEN = 'the Add Animal dialog shows an error message telling the user that saving the animal failed';

async function submitWith500({ app, browser }: any) {
  await browser.route('**/api/v1/animals', async (route: any) => {
    if (route.request.method === 'POST') await route.fulfill({ status: 500, json: { success: false, error: 'Injected 500' } });
    else await route.fallback();
  });
  await app.open('/staff-fields-main.html');
  await browser.locator('#openAddAnimalModal').tap();
  await browser.locator('#animalType').selectOption({ value: 'tortoise' });
  await browser.locator('#animalAmount').fill('123');
  await browser.locator('#addAnimalForm button[type=submit]').tap();
}

test('E7 e2e kod naiwny: tekst błędu jest widoczny', { session: 'demo', tags: ['e7', 'code'] }, async (ctx) => {
  await submitWith500(ctx);
  await expect(ctx.screen.getByText('Injected 500')).toBeVisible();
});

test('E7 e2e kod po id: #animalMessage zawiera błąd', { session: 'demo', tags: ['e7', 'code'] }, async (ctx) => {
  await submitWith500(ctx);
  await expect(ctx.browser.locator('#animalMessage')).toContainText('Injected 500');
});

test('E7 e2e kod jak użytkownik: błąd w modalu', { session: 'demo', tags: ['e7', 'code'] }, async (ctx) => {
  await submitWith500(ctx);
  await expect(ctx.browser.locator('#addAnimalModal')).toContainText('Injected 500');
});

test('E7 e2e agent.assert (drzewo)', { session: 'demo', tags: ['e7', 'ai'] }, async (ctx) => {
  await submitWith500(ctx);
  await ctx.agent.assert(ERROR_SEEN);
});

test('E7 e2e agent.assert vision: true', { session: 'demo', tags: ['e7', 'ai'] }, async (ctx) => {
  await submitWith500(ctx);
  await ctx.agent.assert(ERROR_SEEN, { vision: true });
});

test("E7 e2e agent.assert vision: 'only'", { session: 'demo', tags: ['e7', 'ai'] }, async (ctx) => {
  await submitWith500(ctx);
  await ctx.agent.assert(ERROR_SEEN, { vision: 'only' });
});

// Ogólne sformułowanie, bez podpowiedzi „w modalu”: tak napisałby je ktoś, kto nie zna buga.
const ERROR_GENERIC = 'the user can see an error message saying that adding the animal failed';

test('E7 e2e agent.assert ogólne (drzewo)', { session: 'demo', tags: ['e7', 'ai', 'generic'] }, async (ctx) => {
  await submitWith500(ctx);
  await ctx.agent.assert(ERROR_GENERIC);
});

// Od e2e 0.22 wpisanie hasła w setupie nie blokuje już zrzutów ekranu, więc vision działa na zwykłej sesji demo.
test("E7 e2e agent.assert ogólne vision: 'only'", { session: 'demo', tags: ['e7', 'ai', 'generic', 'vision'] }, async (ctx) => {
  await submitWith500(ctx);
  await ctx.agent.assert(ERROR_GENERIC, { vision: 'only' });
});
