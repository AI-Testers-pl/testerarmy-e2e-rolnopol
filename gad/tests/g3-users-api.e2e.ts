import { expect, test } from 'e2e';
import { z } from 'zod';

// G3. DDT API rejestracji. Bliźniak: L11 tests/api/users-validation/users.register.api.spec.ts (request objecty, fabryki).
// W e2e: fetch + value matchers + toMatchSchema (zod), bez request objectów.
const payload = () => ({ email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.pl`, firstname: 'Ada', lastname: 'Tester', password: 'Haslo123!', avatar: './data/users/face.png' });
const post = (app: any, body: object) =>
  fetch(new URL('/api/users', app.baseUrl), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const User = z.object({ id: z.number(), email: z.string().email(), firstname: z.string(), lastname: z.string() });

test('G3 API: poprawny użytkownik', { tags: ['g3'] }, async ({ app }) => {
  const res = await post(app, payload());
  expect(res.status).toBe(201);
  expect(await res.json()).toMatchSchema(User);
});

for (const input of ['undefined', 'null', 'NULL', '(null)', 'nil', 'true', 'false']) {
  test(`G3 API: niestandardowe firstname „${input}”`, { tags: ['g3'] }, async ({ app }) => {
    expect((await post(app, { ...payload(), firstname: input })).status).toBe(201);
  });
}

for (const key of ['email', 'firstname', 'lastname', 'password', 'avatar']) {
  test(`G3 API: puste ${key} → 422`, { tags: ['g3'] }, async ({ app }) => {
    expect((await post(app, { ...payload(), [key]: '' })).status).toBe(422);
  });
  test(`G3 API: brak pola ${key} → 422`, { tags: ['g3'] }, async ({ app }) => {
    const body: Record<string, unknown> = payload();
    delete body[key];
    expect((await post(app, body)).status).toBe(422);
  });
}
