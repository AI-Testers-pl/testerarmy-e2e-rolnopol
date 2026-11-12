import { test } from '@e2e-dev/web';
import { credentials, expect } from 'e2e';

import { GAD_PASSWORD } from '../e2e.gad.config.ts';

test.setup('logowanie do GAD', { sessions: ['gad'] }, async ({ app, screen, browser, session }) => {
  const user = credentials.user('gad');
  // Konto testowe przez API GAD: 201 = założone, 409 = już jest.
  // Hasło z configu, bo Secret z credentials celowo nie oddaje wartości (działa tylko w fill).
  const res = await fetch(new URL('/api/users', app.baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: user.username, firstname: 'E2E', lastname: 'Agent', password: GAD_PASSWORD, avatar: './data/users/face.png' }),
  });
  expect([201, 409]).toContain(res.status);
  await app.open('/login/');
  await screen.getByPlaceholder('Enter User Email').fill(user.username);
  await screen.getByPlaceholder('Enter Password').fill(user.password);
  await screen.getByRole('button', 'LogIn').tap();
  await expect(browser).toHaveURL(/welcome/);
  await session.save('gad');
});
