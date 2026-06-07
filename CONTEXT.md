# Context

Domain language and shared understanding for this repo. The engineering skills read this
before exploring the codebase so their output uses the project's own vocabulary.

> **Status:** This is an early-stage sandbox. The `play` app is still close to the default
> Nx scaffold, so the glossary below is mostly a stub. Add terms here as real concepts
> emerge — `/grill-with-docs` will append to it lazily as decisions get resolved.

## What this is

`play` is a personal sandbox / playground workspace for experimenting with the Angular +
Nx toolchain. It is not a product; its purpose is to try things out. Expect throwaway
apps and libs rather than a stable domain.

## Tech stack

- **Monorepo:** [Nx](https://nx.dev) 22.7 — projects live under `apps/` (and `libs/` once
  any exist). Run tasks via `nx` (`pnpm nx <target> <project>`), never the underlying tool
  directly. See `CLAUDE.md` for the Nx working agreement.
- **Framework:** Angular 21 (standalone components, signal-based APIs).
- **Package manager:** pnpm 11 (workspace pinned via `packageManager` in `package.json`).
- **Unit tests:** Vitest (with jsdom).
- **E2E tests:** Playwright (`apps/play-e2e`).
- **Lint/format:** ESLint (flat config, `eslint.config.mjs`) + Prettier.
- **Dev environment:** Nix flake (`flake.nix`) provides the toolchain; `direnv` (`.envrc`)
  loads it. `node_modules/.bin` is on the devShell PATH.

## Workspace layout

```
/
├── apps/
│   ├── play/        ← the Angular application (currently the default Nx welcome scaffold)
│   └── play-e2e/    ← Playwright e2e suite for `play`
├── docs/
│   ├── adr/         ← architectural decision records (see docs/agents/domain.md)
│   └── agents/      ← per-repo config the engineering skills read
├── CONTEXT.md       ← this file
├── CLAUDE.md / AGENTS.md  ← agent working agreements (Nx + Agent skills)
└── nx.json, pnpm-workspace.yaml, flake.nix, …
```

## Glossary

Domain concepts and the exact terms we use for them. One entry per concept; prefer the
term here over synonyms. (Empty for now — fill in as the project grows real vocabulary.)

| Term | Meaning |
| ---- | ------- |
| _Project_ (Nx) | A buildable/testable unit in the workspace — an app or a lib. Addressed by name in `nx` commands. |
| _Target_ (Nx) | A runnable task on a project (e.g. `build`, `test`, `lint`, `e2e`), inferred or defined in `project.json`. |

## Conventions

- All task execution goes through Nx; prefer `nx affected` in CI-like flows.
- New projects are scaffolded with Nx generators, not by hand (`/nx-generate`).
- Issues and PRDs are tracked in GitHub Issues — see `docs/agents/issue-tracker.md`.
