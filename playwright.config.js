import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:5181', channel: 'chrome', headless: true, viewport: { width: 1280, height: 960 } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5181 --strictPort', url: 'http://127.0.0.1:5181', reuseExistingServer: !process.env.CI }
});
