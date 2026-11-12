import { test } from '@e2e-dev/web';
import { expect, credentials } from 'e2e';

test.setup('logowanie jako demo', { sessions: ['demo'] }, async ({ app, screen, session, browser }) => {
  const demo = credentials.user('demo');
  await app.open('/login.html');
  await screen.getByLabel('Email').fill(demo.username);
  await screen.getByLabel('Password').fill(demo.password);
  await screen.getByRole('button', 'Login').tap();
  await expect(browser).toHaveURL(/^(?!.*login).*$/);
  await session.save('demo');
});
