import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { tool } from 'ai';
import type { E2EConfig } from 'e2e';
import { defineTool } from 'e2e/agent';
import { z } from 'zod';

import base, { ROLNOPOL_DIR } from './e2e.config.ts';

// Eksperymenty E1–E11: część wymaga przełączenia flag albo chaos engine Rolnopolu (scripts/rolnopol.sh), opis w tests/exp/README.md.
// Uruchomienie: npx e2e run --config e2e.exp.config.ts --tag e1
const shared: E2EConfig = base;

// E9: narzędzie tylko do odczytu, które daje agentowi „prawdę z bazy” (plik danych Rolnopolu, użytkownik demo = id 1).
// Czyta plik zamiast API, bo logowanie przez API unieważniłoby sesję demo (jeden token na użytkownika).
const backendAnimals = defineTool(
  tool({
    description: 'Read the animal groups of the signed-in demo user straight from the backend database (id, type, amount).',
    inputSchema: z.object({}),
    execute: async () => {
      const all = JSON.parse(await readFile(resolve(ROLNOPOL_DIR, 'data/animals.json'), 'utf8'));
      return JSON.stringify(all.filter((a: any) => a.userId === 1).map(({ id, type, amount }: any) => ({ id, type, amount })));
    },
  }),
  { mutates: false },
);

export default {
  ...shared,
  agents: {
    ...shared.agents,
    auditor: {
      ...shared.agents!.qa,
      system: 'You audit what the UI shows against backend data. Use the backendAnimals tool as the source of truth. Fail the step on any mismatch and name it.',
      tools: { backendAnimals },
    },
  },
  // Setup logowania jest potrzebny testom z session: 'demo'.
  tests: ['tests/auth.setup.e2e.ts', 'tests/exp/**/*.e2e.ts'],
} satisfies E2EConfig;
