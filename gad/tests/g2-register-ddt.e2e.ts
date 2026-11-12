import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// G2. DDT rejestracji: puste pole → komunikat „This field is required”. Bliźniak: L11 tests/ui/integration/register.spec.ts.
const FIELDS = ['firstname', 'lastname', 'email', 'password'] as const;
const user = () => ({ firstname: 'Ada', lastname: 'Tester', email: `e2e-${Date.now()}@test.pl`, password: 'Haslo123!' });

async function fillAllBut({ app, screen }: any, empty: string) {
  const u: Record<string, string> = user();
  u[empty] = '';
  await app.open('/register.html');
  for (const f of FIELDS) await screen.getByTestId(`${f}-input`).fill(u[f]);
  await screen.getByTestId('register-button').tap();
}

// Uwaga: pole hasła model widzi zawsze jako <secure>, także puste, więc przy „puste password” agent.assert nie wie,
// czy pole jest puste (fałszywy fail 13.10). Ograniczenie wynika z maskowania sekretów, nie z modelu.
for (const field of FIELDS) {
  test(`G2 kod: puste ${field}`, { tags: ['g2', 'code'] }, async (ctx) => {
    await fillAllBut(ctx, field);
    await expect(ctx.browser.locator(`#octavalidate_${field}`)).toHaveText('This field is required');
  });

  test(`G2 agent.assert: puste ${field}`, { tags: ['g2', 'ai'] }, async (ctx) => {
    await fillAllBut(ctx, field);
    await ctx.agent.assert(`the registration form tells the user that the ${field} field is required, and the account was not created`);
  });
}
