import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import base, { ROLNOPOL_URL } from './e2e.config.ts';

// Bug bash (e2e explore) na już działającym Rolnopolu (bez command). START_PATH ustawia stronę startową explorera:
// planer explore z gpt-4.1 ocenia plan na bieżącym ekranie i przerywa przebieg, gdy celu na nim nie widać.
const shared: E2EConfig = base;
// Uruchomienie: START_PATH=/register.html npx e2e explore "..." --config e2e.bugbash.config.ts --agent fuzzer
const start = process.env.START_PATH ?? '/';
const persona = {
  ...shared.agents!.qa,
  maxSteps: 40,
  maxModelCalls: 40,
  context: shared.agents!.qa.context +
    ' The local app sends no email. Seeded demo data (demo@example.com, existing animals and fields) is not a bug.',
};

export default {
  ...shared,
  targets: [{ name: 'web', engine: web(), app: { url: `${ROLNOPOL_URL}${start}` } }],
  retries: 0,
  agents: {
    default: persona,
    skeptic: { ...persona, system: 'Distrust every number, count and message on screen; cross-check each save against the list and the totals.' },
    fuzzer: { ...persona, system: "At every input, run the goal's input matrix before anything else, judging each entry before the next. Never take the happy path." },
  },
} satisfies E2EConfig;
