import { test } from '@e2e-dev/web';
import { expect, unique } from 'e2e';

// Wariant 2: agent wypełnia formularz, twarde fakty sprawdza kod.
test('rejestracja - mixed', { tags: ['register', 'mixed'] }, async ({ app, agent, screen, browser }) => {
  const email = `e2e-${Date.now()}@example.test`;

  await app.open('/register.html');
  await agent.act('register a new account with email {email}, display name {name} and password {password}', {
    // unique(): inny adres przy każdym uruchomieniu, a cache dalej trafia
    params: { email: unique(email), name: 'Rolnik E2E', password: 'Haslo123!' },
  });
  await expect(browser).toHaveURL('/login.html');

  await screen.getByLabel('Email').fill(email);
  await screen.getByLabel('Password').fill('Haslo123!');
  await screen.getByRole('button', 'Login').tap();
  await expect(browser).toHaveURL(/^(?!.*login).*$/);
});
