import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { copilot } from 'e2e/oauth/copilot';

// Rolnopol (github.com/jaktestowac/rolnopol) sklonowany obok tego projektu: ../rolnopol.
// Inny katalog albo port: ROLNOPOL_DIR=/sciezka/do/rolnopol ROLNOPOL_PORT=3100 npx e2e run
export const ROLNOPOL_DIR = process.env.ROLNOPOL_DIR ?? '../rolnopol';
export const ROLNOPOL_PORT = process.env.ROLNOPOL_PORT ?? '3000';
export const ROLNOPOL_URL = process.env.APP_URL ?? `http://localhost:${ROLNOPOL_PORT}`;

// Model: GitHub Copilot z logowania `npx e2e login github-copilot`. Lista modeli: `npx e2e models github-copilot`.
// Domyślnie gpt-4.1: w Copilocie nie zużywa limitu premium requests. Sonnet 4.6 zużywa limit przy każdym
// wywołaniu modelu (test z agentem to 5-15 wywołań), więc 300 zapytań Copilot Pro wystarcza na kilkanaście minut testów.
// Inny model bez zmiany kodu: E2E_MODEL=claude-sonnet-4.6 npx e2e run
const model = copilot(process.env.E2E_MODEL ?? 'gpt-4.1');

export default {
  agents: {
    default: {
      model,
      system: 'You are a thorough QA agent. Verify every outcome.',
    },
    // qa: zna pułapki Rolnopolu. Bez tego agent przewijał stronicowaną listę zwierząt i fałszywie orzekał „nie dodano”.
    qa: {
      model,
      system: 'You are a thorough QA agent. Verify every outcome.',
      context: 'Rolnopol is a farm management app. Lists of animals, fields and staff are paginated: the animals search box ("Search animals...") filters by animal type only, so search for the type, not the amount.',
    },
    // doer: wykonuje kroki i nie sprawdza wyniku, bo wynik sprawdza test twardą asercją. Dzięki temu krok trafia do cache.
    doer: {
      model,
      system: 'Perform exactly the requested UI steps. Do not search for or verify the result afterwards: the test checks it.',
    },
  },
  targets: [{
    engine: web(),
    app: {
      url: ROLNOPOL_URL,
      readyUrl: `${ROLNOPOL_URL}/health`,
      // Runner sam startuje Rolnopol i zatrzymuje go po testach.
      // NODE_ENV=test zdejmuje limit 100 zapytań na 30 s (api/limiters.js w Rolnopolu).
      // reuseExisting: jeśli na tym porcie już coś działa, runner użyje tego zamiast startować Rolnopol.
      command: {
        executable: process.execPath,
        args: ['api/index.js'],
        cwd: ROLNOPOL_DIR,
        env: { NODE_ENV: 'test', PORT: ROLNOPOL_PORT },
        reuseExisting: true,
        log: '.e2e/logs/rolnopol.log',
      },
    },
  }],
  // Konto demo z README Rolnopolu. Rolnopol trzyma jeden token na użytkownika, dlatego logujemy się raz, w setupie.
  credentials: {
    demo: {
      username: 'demo@example.com',
      password: process.env.ROLNOPOL_PASSWORD ?? 'demo123',
    },
  },
  // Eksperymenty z tests/exp mają własny config (e2e.exp.config.ts), bo część z nich wymaga przełączenia flag Rolnopolu.
  tests: ['tests/**/*.e2e.ts', '!tests/exp/**'],
  workers: 1,
} satisfies E2EConfig;
