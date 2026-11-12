import { test } from '@e2e-dev/web';
import { expect, unique } from 'e2e';

// G1. Cykl życia artykułu w GAD. Bliźniak: L11 tests/ui/end-to-end/article-lifecycle.spec.ts (POM + fixture createRandomArticle).
const article = () => ({ title: `E2E article ${Date.now()}`, body: 'Body written by the e2e agent test.' });

test('G1 mieszany: agent dodaje artykuł, kod sprawdza', { session: 'gad', tags: ['g1', 'mixed'] }, async ({ app, agent, screen }) => {
  const a = article();
  await app.open('/articles.html');
  await agent.act('add a new article with title {title} and body {body}', { params: { title: unique(a.title), body: a.body }, agent: 'doer' });
  await expect(screen.getByTestId('article-title')).toHaveText(a.title);
  await expect(screen.getByTestId('article-body')).toContainText(a.body);
});

test('G1 agentowy: dodanie, sprawdzenie i usunięcie', { session: 'gad', tags: ['g1', 'agent'] }, async ({ app, agent, browser }) => {
  // Usunięcie otwiera confirm(): agent nie obsłuży dialogu (bez tego krok kończy się „blocked”), robi to kod.
  await browser.onDialog('accept');
  const a = article();
  await app.open('/articles.html');
  await agent.act('add a new article with title {title} and body {body}', { params: { title: unique(a.title), body: a.body } });
  await agent.assert(`the page shows the article titled "${a.title}" with its body`);
  await agent.act('delete this article');
  await agent.assert(`the article "${a.title}" is no longer shown and the user is on the articles list`);
});
