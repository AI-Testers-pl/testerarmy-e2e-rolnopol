import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Agent wykonuje krok, a wynik sprawdzają asercje. Cel opisuje czynności, a nie rezultat
// („dodaj grupę” kusi agenta, żeby sam szukał jej na liście).
// Persona doer (e2e.config.ts) nie sprawdza wyniku sama. Domyślny „thorough QA agent” przewijał stronicowaną
// listę zwierząt i fałszywie orzekał, że grupy nie dodano. Lista ma 5 pozycji na stronę, dlatego przed
// sprawdzeniem zawężamy ją wyszukiwarką (filtruje po typie). Niesporczak nie występuje w danych startowych.
test('rolnik dodaje grupę zwierząt', { session: 'demo' }, async ({ app, agent, browser }) => {
  await app.open('/staff-fields-main.html');

  await agent.act('open the add animal form, choose type {type}, enter amount {amount} and submit the form', {
    params: { type: 'Tardigrade', amount: '17' },
    agent: 'doer',
  });

  await browser.locator('#animalsSearch').fill('tardigrade');
  await expect(browser.locator('#animalsList')).toContainText('17');
  await agent.assert('the animals list shows a tardigrade group with amount 17');
});
