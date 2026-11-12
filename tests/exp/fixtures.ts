import { test as base } from '@e2e-dev/web';

export type Animal = { id: number; type: string; amount: number; fieldId?: number };

// Fixture API wg docs/api-testing.mdx: fetch z cookies przeglądarki (rolnopolToken z sesji demo).
// Bliźniak Playwrighta: pw/tests/fixtures.ts (tam page.request dzieli cookies sam).
type Fixtures = {
  api: (path: string, init?: RequestInit) => Promise<Response>;
  animals: { create: (type: string, amount: number) => Promise<Animal>; list: () => Promise<Animal[]> };
};

export const test = base.extend<Pick<Fixtures, 'api'>>({
  api: async ({ app, browser }, use) => {
    await use(async (path, init) => {
      const headers = new Headers(init?.headers);
      headers.set('cookie', (await browser.cookies()).map((c) => `${c.name}=${c.value}`).join('; '));
      headers.set('content-type', 'application/json');
      return fetch(new URL(path, app.baseUrl), { ...init, headers });
    });
  },
}).extend<Pick<Fixtures, 'animals'>>({
  // Sprząta po sobie, także gdy test padnie.
  animals: async ({ api }, use) => {
    const created: number[] = [];
    await use({
      create: async (type, amount) => {
        const res = await api('/api/v1/animals', { method: 'POST', body: JSON.stringify({ type, amount }) });
        if (res.status !== 201) throw new Error(`POST /animals: ${res.status} ${await res.text()}`);
        const animal = (await res.json()).data as Animal;
        created.push(animal.id);
        return animal;
      },
      list: async () => (await (await api('/api/v1/animals')).json()).data as Animal[],
    });
    for (const id of created) await api(`/api/v1/animals/${id}`, { method: 'DELETE' });
  },
});
