import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// E2. Funkcja znika: eksport danych za flagą staffFieldsExportEnabled.
// Gdy flaga jest wyłączona, strona eksportu przekierowuje na /staff-fields-main.html
// i pokazuje modal „Export Unavailable”. Kto powie prawdę, że eksportu nie ma?

test('E2 playwright: pobranie eksportu zwierząt', { session: 'demo', tags: ['e2', 'playwright'] }, async ({ app, screen, browser }) => {
  await app.open('/staff-fields-export.html');
  const file = await browser.waitForDownload(() => screen.getByRole('button', 'Animals JSON').tap());
  expect(file.path).toContain('animals-export');
  await expect(browser.locator('#exportStatus')).toContainText('Animals export downloaded');
});

test('E2 agent: eksport + agent.assert', { session: 'demo', tags: ['e2', 'agent-assert'] }, async ({ app, agent }) => {
  await app.open('/staff-fields-main.html');
  await agent.act('export the animals data to a file');
  await agent.assert('the animals data was exported successfully');
});

test('E2 agent: eksport + twardy status', { session: 'demo', tags: ['e2', 'agent-hard'] }, async ({ app, agent, browser }) => {
  await app.open('/staff-fields-main.html');
  await agent.act('export the animals data to a file');
  await expect(browser.locator('#exportStatus')).toContainText('Animals export downloaded');
});
