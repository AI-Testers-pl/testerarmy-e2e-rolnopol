import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { registerAndSignIn } from './helpers.ts';

// Czy agent.assert łapie błędy? Na poprawnym profilu użytkownika „Rolnik E2E”
// jedna asercja jest prawdziwa, reszta fałszywa i ma zostać odrzucona.
const CASES: Array<[string, 'holds' | 'fails']> = [
  ['the page greets the signed-in user as Rolnik E2E', 'holds'],
  ['the page greets the signed-in user as Rolnik Testowy', 'fails'],
  ['the page greets the signed-in user as Rolnik E2F', 'fails'], // jedna litera różnicy
  ['the user is on the login page', 'fails'],
  ['the page shows an error message about a failed registration', 'fails'],
];

test('mutacje asercji AI', { tags: ['mutations'] }, async (ctx) => {
  await registerAndSignIn(ctx);
  const verdicts: string[] = [];
  for (const [statement, expected] of CASES) {
    let verdict = 'holds';
    try {
      await ctx.agent.assert(statement);
    } catch (e: any) {
      verdict = String(e?.code ?? e?.message ?? e).includes('INCONCLUSIVE') ? 'inconclusive' : 'fails';
    }
    verdicts.push(`${verdict === expected ? 'OK ' : 'ZLE'} ${expected} -> ${verdict}: ${statement}`);
  }
  console.log(verdicts.join('\n'));
  expect(verdicts.filter((v) => v.startsWith('ZLE'))).toEqual([]);
});
