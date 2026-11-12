import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Wariant 1: klasyczny, tylko lokatory i expect. Zero wywołań modelu.
test('rejestracja - playwright', { tags: ['register', 'playwright'] }, async ({ app, screen, browser }) => {
  const email = `e2e-${Date.now()}@example.test`;

  await app.open('/register.html');
  await screen.getByTestId('email-input').fill(email);
  await screen.getByTestId('display-name-input').fill('Rolnik E2E');
  await screen.getByTestId('password-input').fill('Haslo123!');
  await screen.getByTestId('register-submit-btn').tap();
  await expect(browser).toHaveURL('/login.html');

  // Pierwsze logowanie nowym kontem potwierdza, że konto istnieje.
  await screen.getByLabel('Email').fill(email);
  await screen.getByLabel('Password').fill('Haslo123!');
  await screen.getByRole('button', 'Login').tap();
  await expect(browser).toHaveURL(/^(?!.*login).*$/);
});
