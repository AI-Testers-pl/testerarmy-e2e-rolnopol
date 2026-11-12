import { test } from '@e2e-dev/web';
import { registerAndSignIn } from './helpers.ts';

// Wariant 4: zwykłe akcje, sprawdzenie przez AI (wiersz „ordinary actions, AI checks” z wpisu Sławka).
test('rejestracja - ai-check', { tags: ['register', 'ai-check'] }, async (ctx) => {
  await registerAndSignIn(ctx);
  await ctx.agent.assert('the page greets the signed-in user as Rolnik E2E');
});
