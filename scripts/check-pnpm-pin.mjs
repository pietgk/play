#!/usr/bin/env node
// Guard: the Nix-provided pnpm (flake.nix toolPackages, pinned offline via
// flake.lock — ADR 0008) must match package.json's `packageManager`. Two pins,
// one invariant — enforced here so a `nix flake update` that bumps nixpkgs' pnpm
// can't silently diverge from the declared version.
//
// We read the actually-installed pnpm version from ITS OWN package.json on disk
// rather than shelling out to `pnpm --version`: pnpm self-manages to the
// `packageManager` version, so `pnpm --version` reports the DECLARED version and
// would mask exactly the drift we want to catch. The on-disk binary is the only
// honest source for "what version did Nix actually install."
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';

function resolveOnPath(bin) {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    const p = join(dir, bin);
    if (existsSync(p)) return realpathSync(p);
  }
  throw new Error(`${bin} not found on PATH`);
}

function installedPnpmVersion() {
  // realpath lands at <store>/libexec/pnpm/bin/pnpm.mjs; walk up to the nearest
  // package.json (pnpm's own) and read its version.
  let dir = dirname(resolveOnPath('pnpm'));
  for (let i = 0; i < 6; i++) {
    const pj = join(dir, 'package.json');
    if (existsSync(pj)) {
      const { version } = JSON.parse(readFileSync(pj, 'utf8'));
      if (version) return version;
    }
    dir = dirname(dir);
  }
  throw new Error('could not determine the installed pnpm version from its package.json');
}

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const declared = (pkg.packageManager ?? '').match(/^pnpm@(.+)$/)?.[1];
if (!declared) {
  console.error('check-pnpm-pin: package.json "packageManager" is not "pnpm@<version>".');
  process.exit(1);
}

const actual = installedPnpmVersion();
if (actual !== declared) {
  console.error(
    `check-pnpm-pin: pnpm version drift.\n` +
      `  Nix-installed pnpm (flake.lock): ${actual}\n` +
      `  package.json packageManager:     ${declared}\n` +
      `Fix: align package.json "packageManager" with the flake's pnpm, ` +
      `or bump the flake (nix flake update) to match.`,
  );
  process.exit(1);
}
console.log(`check-pnpm-pin: ok (pnpm ${actual} matches packageManager).`);
