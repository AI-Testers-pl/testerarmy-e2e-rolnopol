import { expect } from 'e2e';

// Rejestracja i pierwsze logowanie samym kodem (bez modelu). Zwraca email nowego konta.
export async function registerAndSignIn({ app, screen, browser }: any, name = 'Rolnik E2E'): Promise<string> {
  const email = `e2e-${Date.now()}@example.test`;
  await app.open('/register.html');
  await screen.getByTestId('email-input').fill(email);
  await screen.getByTestId('display-name-input').fill(name);
  await screen.getByTestId('password-input').fill('Haslo123!');
  await screen.getByTestId('register-submit-btn').tap();
  await expect(browser).toHaveURL('/login.html');
  await screen.getByLabel('Email').fill(email);
  await screen.getByLabel('Password').fill('Haslo123!');
  await screen.getByRole('button', 'Login').tap();
  await expect(browser).toHaveURL(/^(?!.*login).*$/);
  return email;
}
