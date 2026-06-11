import { spawn } from 'node:child_process';

const appUrl = 'http://localhost:4200';
const server = spawn(
  'pnpm',
  [
    'exec',
    'http-server',
    'dist/apps/play/browser',
    '--port',
    '4200',
    '--cors',
    '-c-1',
  ],
  { stdio: 'inherit' },
);
let ready = false;

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(appUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!ready) throw new Error(`Playground did not start at ${appUrl}`);

  const tests = spawn(
    'pnpm',
    [
      'exec',
      'playwright',
      'test',
      '--config',
      'apps/play-e2e/playwright.config.ts',
    ],
    { stdio: 'inherit' },
  );

  const exitCode = await new Promise((resolve, reject) => {
    tests.on('error', reject);
    tests.on('exit', (code) => resolve(code ?? 1));
  });

  process.exitCode = exitCode;
} finally {
  server.kill('SIGTERM');
}
