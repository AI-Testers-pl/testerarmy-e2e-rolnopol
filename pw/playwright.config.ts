import { defineConfig, devices } from '@playwright/test';

// Playwright Test obok e2e: te same scenariusze Rolnopolu (eksperymenty E6–E11, 13.10.2026).
// Rolnopol musi działać (w ../../rolnopol: NODE_ENV=test npm start). Inny adres: APP_URL=http://localhost:3100
export const DEMO_STATE = '.auth/demo.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.APP_URL ?? 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: DEMO_STATE },
    },
  ],
});
