import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// E5. Redesign: zmiana etykiety przycisku „Add Animal” na „Register livestock” w Rolnopolu
// (ręczna edycja public/staff-fields-main.html na czas eksperymentu, potem git checkout).
// Obietnica: cache odtwarza kroki, a gdy UI się zmieni, agent „leczy” krok sam.
// Playwright dodaje żółwie, agent niesporczaki: lista ma 5 pozycji na stronę, więc każdy wariant ma własny typ.
const amount = () => String(400 + Math.floor(Math.random() * 500));

test('E5 playwright: lokator po roli i nazwie', { session: 'demo', tags: ['e5', 'playwright'] }, async ({ app, screen, browser }) => {
  const n = amount();
  await app.open('/staff-fields-main.html');
  await screen.getByRole('button', '+ Add Animal').tap();
  await browser.locator('#animalType').selectOption({ value: 'tortoise' });
  await browser.locator('#animalAmount').fill(n);
  await browser.locator('#addAnimalForm button[type=submit]').tap();
  await browser.locator('#animalsSearch').fill('tortoise');
  await expect(browser.locator('#animalsList')).toContainText(n);
});

test('E5 agent z cache + twardy expect', { session: 'demo', tags: ['e5', 'agent'] }, async ({ app, agent, browser }) => {
  await app.open('/staff-fields-main.html');
  await agent.act('open the add animal form, choose type {type}, enter amount {amount} and submit the form', { params: { type: 'Tardigrade', amount: '777' }, agent: 'doer' });
  await browser.locator('#animalsSearch').fill('tardigrade');
  await expect(browser.locator('#animalsList')).toContainText('777');
});
