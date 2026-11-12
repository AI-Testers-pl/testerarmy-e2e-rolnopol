import { expect, test } from './fixtures';

// E7 (Playwright). Zapis zwierzęcia kończy się 500 (mock zamiast chaos engine).
// Pytanie: czy test zauważy, że użytkownik nie widzi komunikatu o błędzie?
// (W Rolnopolu id="animalMessage" jest dwa razy: pod listą i w modalu.)
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/animals', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 500, json: { success: false, error: 'Injected 500' } })
      : route.continue(),
  );
  await page.goto('/staff-fields-main.html');
  await page.locator('#openAddAnimalModal').click();
  await page.locator('#animalType').selectOption('tortoise');
  await page.locator('#animalAmount').fill('123');
  await page.locator('#addAnimalForm button[type=submit]').click();
});

test('E7 PW naiwny: tekst błędu jest widoczny', async ({ page }) => {
  await expect(page.getByText('Injected 500')).toBeVisible();
});

test('E7 PW po id: #animalMessage zawiera błąd', async ({ page }) => {
  await expect(page.locator('#animalMessage')).toContainText('Injected 500');
});

test('E7 PW jak użytkownik: błąd jest w otwartym modalu', async ({ page }) => {
  await expect(page.locator('#addAnimalModal')).toContainText('Injected 500');
});
