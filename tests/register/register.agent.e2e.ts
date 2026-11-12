import { test } from '@e2e-dev/web';
import { unique } from 'e2e';

// Wariant 3: w pełni agentowy, bez lokatorów i expect.
test('rejestracja - agent', { tags: ['register', 'agent'] }, async ({ app, agent }) => {
  const email = `e2e-${Date.now()}@example.test`;

  await app.open('/register.html');
  await agent.act('register a new account with email {email}, display name {name} and password {password}', {
    params: { email: unique(email), name: 'Rolnik E2E', password: 'Haslo123!' },
  });
  await agent.act('sign in with email {email} and password {password}', {
    params: { email: unique(email), password: 'Haslo123!' },
  });
  await agent.assert('the user is signed in and no longer on the login page');
});
