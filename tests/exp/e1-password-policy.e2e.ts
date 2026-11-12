import { test } from '@e2e-dev/web';
import { expect, unique } from 'e2e';

// E1. Zmiana wymagań przez feature flagę registrationStrongPasswordEnabled.
// Ten sam scenariusz z hasłem „abc123” (dobre przy słabej polityce, złe przy silnej).
// Pytanie: kto zauważy zmianę wymagań, a kto się „dostosuje” i przejdzie na zielono?
// Hasło jest tu przedmiotem testu, więc idzie jako zwykły param (trafia do modelu i do .e2e/cache).
// Prawdziwe hasła tylko przez credentials/Secret.
const WEAK = 'abc123';
const email = () => `e1-${Date.now()}@example.test`;

test('E1 playwright: rejestracja hasłem abc123', { tags: ['e1', 'playwright'] }, async ({ app, screen, browser }) => {
  await app.open('/register.html');
  await screen.getByTestId('email-input').fill(email());
  await screen.getByTestId('display-name-input').fill('Rolnik E1');
  await screen.getByTestId('password-input').fill(WEAK);
  await screen.getByTestId('register-submit-btn').tap();
  await expect(browser).toHaveURL('/login.html');
});

test('E1 agent z hasłem w params + twarda asercja', { tags: ['e1', 'agent-params'] }, async ({ app, agent, browser }) => {
  await app.open('/register.html');
  await agent.act('register a new account with email {email}, display name {name} and password {password}', {
    params: { email: unique(email()), name: 'Rolnik E1', password: WEAK },
  });
  await expect(browser).toHaveURL('/login.html');
});

test('E1 agent z hasłem w params + tylko agent.assert', { tags: ['e1', 'agent-assert'] }, async ({ app, agent }) => {
  await app.open('/register.html');
  await agent.act('register a new account with email {email}, display name {name} and password {password}', {
    params: { email: unique(email()), name: 'Rolnik E1', password: WEAK },
  });
  await agent.assert('the account was registered successfully');
});

test('E1 agent bez hasła (cel biznesowy)', { tags: ['e1', 'agent-goal'] }, async ({ app, agent, browser }) => {
  await app.open('/register.html');
  await agent.act('register a new account with email {email} and display name {name}', {
    params: { email: unique(email()), name: 'Rolnik E1' },
  });
  await expect(browser).toHaveURL('/login.html');
});
