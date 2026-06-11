import { spawn } from 'node:child_process';

const storybookUrl = 'http://localhost:4400';
const server = spawn(
  'pnpm',
  [
    'exec',
    'http-server',
    'dist/storybook/ui',
    '--port',
    '4400',
    '--cors',
    '-c-1',
  ],
  { stdio: 'inherit' },
);
let ready = false;

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(storybookUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!ready) throw new Error(`Storybook did not start at ${storybookUrl}`);

  const tests = spawn(
    'pnpm',
    [
      'exec',
      'test-storybook',
      '-c',
      'libs/ui/.storybook',
      `--url=${storybookUrl}`,
      '--maxWorkers=1',
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
