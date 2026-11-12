import { type APIRequestContext, test as base } from '@playwright/test';

export type Animal = { id: number; type: string; amount: number; fieldId?: number };

// Fixture API: page.request dzieli cookies z przeglądarką (rolnopolToken z sesji demo).
// Sprząta po sobie: usuwa zwierzęta utworzone w teście, także gdy test padnie.
type Fixtures = {
  api: APIRequestContext;
  animals: { create: (type: string, amount: number) => Promise<Animal>; list: () => Promise<Animal[]> };
};

export const test = base.extend<Fixtures>({
  api: async ({ page }, use) => {
    await use(page.request);
  },
  animals: async ({ api }, use) => {
    const created: number[] = [];
    await use({
      create: async (type, amount) => {
        const res = await api.post('/api/v1/animals', { data: { type, amount } });
        if (res.status() !== 201) throw new Error(`POST /animals: ${res.status()} ${await res.text()}`);
        const animal = (await res.json()).data as Animal;
        created.push(animal.id);
        return animal;
      },
      list: async () => (await (await api.get('/api/v1/animals')).json()).data as Animal[],
    });
    for (const id of created) await api.delete(`/api/v1/animals/${id}`);
  },
});

export { expect } from '@playwright/test';
