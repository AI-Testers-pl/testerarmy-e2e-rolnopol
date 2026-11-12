import { test } from '@e2e-dev/web';
import { expect, unique } from 'e2e';

// E11. Port 1:1 testów staff-fields z frameworka AIT1 (D13/L06, Playwright, POM) do e2e.
// Co się zmienia: nie ma Page, więc page object owija screen + browser; click → tap;
// getByRole(role, { name }) → getByRole(role, name), przy czym string w e2e musi pasować do całej nazwy; waitFor({ state: 'hidden' }) → expect(...).toBeHidden().
class StaffFieldsMainScreen {
  readonly PAGE_URL = '/staff-fields-main.html';
  constructor(private readonly t: { app: any; screen: any; browser: any }) {}

  get pageHeading() { return this.t.screen.getByRole('heading', 'Staff & Fields Management'); }
  get fieldAddedAlert() { return this.t.screen.getByText('Field added!'); }

  async goto() { await this.t.app.open(this.PAGE_URL); }

  async addField(name: string, areaInHa: number) {
    await this.t.browser.locator('#openAddFieldModal').tap();
    await this.t.screen.getByRole('textbox', /Field Name/).fill(name);
    await this.t.screen.getByRole('spinbutton', /Area \(ha\)/).fill(String(areaInHa));
    await this.t.browser.locator('#addFieldForm').getByRole('button', /Add Field/).tap(); // w e2e nazwa jako string = cały tekst („+ Add Field”), w PW wystarczał fragment
  }

  async searchFieldByName(name: string) { await this.t.screen.getByRole('textbox', 'Search fields...').fill(name); }
  fieldListItemByName(name: string) { return this.t.browser.locator('li').filter({ hasText: name }).first(); }

  async addAnimal(type: string, amount: number) {
    await this.t.browser.locator('#openAddAnimalModal').tap();
    await this.t.browser.locator('#addAnimalModal').getByRole('combobox', 'Type').selectOption({ value: type });
    await this.t.browser.locator('#addAnimalModal').getByRole('spinbutton', /Amount/).fill(String(amount));
    await this.t.browser.locator('#addAnimalForm button[type=submit]').tap();
    await expect(this.t.browser.locator('#addAnimalModal')).toBeHidden();
  }

  async searchAnimalByType(type: string) { await this.t.screen.getByRole('textbox', 'Search animals...').fill(type); }
  animalListItemByType(type: string) { return this.t.browser.locator('#animalsList li').filter({ hasText: type }).first(); }
}

test('E11 port: nowe pole w Staff & Fields', { session: 'demo', tags: ['e11'] }, async ({ app, screen, browser }) => {
  const page = new StaffFieldsMainScreen({ app, screen, browser });
  const name = `Auto Field ${Date.now()}`;
  await page.goto();
  await expect(browser).toHaveURL(page.PAGE_URL);
  await expect(page.pageHeading).toBeVisible();
  await page.addField(name, 7);
  await expect(page.fieldAddedAlert).toBeVisible();
  await page.searchFieldByName(name);
  await expect(page.fieldListItemByName(name)).toBeVisible();
});

test('E11 port: nowa grupa zwierząt w Staff & Fields', { session: 'demo', tags: ['e11'] }, async ({ app, screen, browser }) => {
  const page = new StaffFieldsMainScreen({ app, screen, browser });
  await page.goto();
  await expect(page.pageHeading).toBeVisible();
  await page.addAnimal('sheep', 50);
  await page.searchAnimalByType('sheep');
  await expect(page.animalListItemByType('sheep')).toBeVisible();
});

// Ta sama ścieżka z agentem: zamiast page objectu jeden cel, wynik twardo (persona doer → cache).
test('E11 agent: nowe pole w Staff & Fields', { session: 'demo', tags: ['e11', 'agent'] }, async ({ app, screen, browser, agent }) => {
  const name = `Auto Field ${Date.now()}`;
  await app.open('/staff-fields-main.html');
  await agent.act('add a new field named {name} with area {area} ha', { params: { name: unique(name), area: '7' }, agent: 'doer' }); // unique(): inna nazwa co przebieg, a cache dalej trafia
  await expect(screen.getByText('Field added!')).toBeVisible();
  await screen.getByRole('textbox', 'Search fields...').fill(name);
  await expect(browser.locator('li').filter({ hasText: name }).first()).toBeVisible();
});
