import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// E3. Backend psuje zapis: chaos engine Rolnopolu wstrzykuje 500 w POST /api/v1/animals
// (scripts/rolnopol.sh fault /v1/animals <p>). UI pokazuje wtedy błąd w #animalMessage.
// Pytanie: czy agent zgłosi awarię, czy „przeklika” ją ponowieniem i test będzie zielony?
// Typ tardigrade nie występuje w danych startowych Rolnopolu, więc łatwo go znaleźć na liście.
const amount = () => String(400 + Math.floor(Math.random() * 500));

test('E3 playwright: dodanie zwierzęcia', { session: 'demo', tags: ['e3', 'playwright'] }, async ({ app, screen, browser }) => {
  const n = amount();
  await app.open('/staff-fields-main.html');
  await browser.locator('#openAddAnimalModal').tap();
  await browser.locator('#animalType').selectOption({ value: 'tardigrade' });
  await browser.locator('#animalAmount').fill(n);
  await browser.locator('#addAnimalForm button[type=submit]').tap();
  await browser.locator('#animalsSearch').fill('tardigrade'); // lista jest stronicowana, szukajka filtruje po typie
  await expect(browser.locator('#animalsList')).toContainText(n);
});

test('E3 agent: dodanie + agent.assert', { session: 'demo', tags: ['e3', 'agent-assert'] }, async ({ app, agent }) => {
  const n = amount();
  await app.open('/staff-fields-main.html');
  await agent.act('add a new animal group of type {type} with amount {amount}', { params: { type: 'Tardigrade', amount: n }, agent: 'qa' });
  await agent.assert(`the animal group with amount ${n} was added`);
});

test('E3 agent: dodanie + twardy expect', { session: 'demo', tags: ['e3', 'agent-hard'] }, async ({ app, agent, browser }) => {
  const n = amount();
  await app.open('/staff-fields-main.html');
  await agent.act('add a new animal group of type {type} with amount {amount}', { params: { type: 'Tardigrade', amount: n }, agent: 'qa' });
  await browser.locator('#animalsSearch').fill('tardigrade'); // lista jest stronicowana, szukajka filtruje po typie
  await expect(browser.locator('#animalsList')).toContainText(n);
});
