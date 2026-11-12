import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

import { fileURLToPath } from 'node:url';

import base from '../e2e.config.ts';

// Dodatek: te same techniki na aplikacji GAD (github.com/jaktestowac/gad-gui-api-demo), opis w gad/README.md.
// Runner sam startuje GAD z ../gad-gui-api-demo (inny katalog: GAD_DIR) na porcie GAD_PORT (domyślnie 3000).
// Jeśli GAD już działa pod tym adresem, runner go użyje (reuseExisting).
// Konto testowe e2e-agent@test.pl zakłada setup (tests/gad.setup.e2e.ts) przez API GAD. Konta z danych startowych GAD mają hasło
// krótsze niż 6 znaków, a e2e takiego nie przyjmie w credentials (INVALID_CONFIG: krótszego nie da się zamaskować w raportach).
const shared: E2EConfig = base;
export const GAD_PASSWORD = process.env.GAD_PASSWORD ?? 'Haslo123!e2e';
const GAD_DIR = process.env.GAD_DIR ?? fileURLToPath(new URL('../../gad-gui-api-demo', import.meta.url));
const GAD_PORT = process.env.GAD_PORT ?? '3000';
const GAD_URL = process.env.GAD_URL ?? `http://localhost:${GAD_PORT}`;

export default {
  ...shared,
  tests: ['tests/**/*.e2e.ts'],
  targets: [{
    name: 'web',
    engine: web(),
    app: {
      url: GAD_URL,
      command: { executable: process.execPath, args: ['server.js'], cwd: GAD_DIR, env: { PORT: GAD_PORT }, reuseExisting: true, log: '.e2e/logs/gad.log' },
    },
  }],
  credentials: { gad: { username: 'e2e-agent@test.pl', password: GAD_PASSWORD } },
  workers: 1,
} satisfies E2EConfig;
