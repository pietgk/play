# Contributing

This repo has two contribution modes: **human** (you write the code) and **agent** (Sandcastle + Codex writes the code, you review). Both share the same toolchain. This document gets you set up for either.

## Table of contents

- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [Daily workflow — human](#daily-workflow--human)
- [Daily workflow — agent (night shift)](#daily-workflow--agent-night-shift)
- [Issue workflow](#issue-workflow)
- [Architecture references](#architecture-references)

---

## Prerequisites

| Tool | How to get it | Why |
|------|---------------|-----|
| **Homebrew** | [brew.sh](https://brew.sh) | Installs Colima |
| **Nix** (DeterminateSystems) | `curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix \| sh` | The toolchain: Node 24, pnpm, git, gh, Docker clients |
| **direnv** | `brew install direnv` + [shell hook](https://direnv.net/docs/hook.html) | Auto-activates the Nix dev shell on `cd` |
| **Colima** | `brew install colima` | Local Docker runtime (no Docker Desktop) — ADR 0007 |
| **Rosetta 2** | `softwareupdate --install-rosetta --agree-to-license` | Required for Colima's fast `vz` mode on Apple Silicon |
| **Codex CLI** | `npm install -g @openai/codex` then `codex login` | Agent that works GitHub issues inside the sandbox |

> Codex is only required for the agent workflow. Human contributors can skip it.

---

## First-time setup

```bash
# 1. Allow direnv to activate the Nix dev shell
direnv allow

# 2. Start the local container runtime (one-time per machine boot)
#    Run from inside the dev shell — the docker client is provided by Nix
./scripts/colima-up.sh

# 3. Install project dependencies
pnpm install

# 4. Verify everything works
pnpm nx run-many -t lint test build
```

All subsequent terminal sessions auto-activate the dev shell via direnv. You should see:

```
play — node v24.15.0, pnpm 11.5.1, docker 29.5.2
```

on `cd` into the repo.

### Verify the container runtime

```bash
docker info   # should show Colima as the server
```

If Docker commands hang or error, Colima may not be running: `./scripts/colima-up.sh`.

---

## Daily workflow — human

All tasks run through Nx. Never invoke the underlying tools (tsc, vitest, eslint) directly.

```bash
# Run everything affected by your changes
pnpm nx affected -t lint test build

# Run a specific target for a specific project
pnpm nx test play
pnpm nx build play

# Lint + format
pnpm nx run-many -t lint
```

Open a PR against `main`. CI runs the same `nix develop -c pnpm exec nx run-many -t lint test build e2e` pipeline.

---

## Daily workflow — agent (night shift)

Sandcastle runs Codex in a sandboxed Docker container. The agent picks up issues labelled `Sandcastle`, implements them one by one, commits the results to your local branch, and closes the issues. You review and push in the morning.

### One-time agent setup

**1. Build the sandbox image** (once, and again when `flake.lock` or `.sandcastle/Dockerfile` changes):

```bash
pnpm sandcastle:build
```

This produces `sandcastle:play` — a Nix-based image with the exact same toolchain as CI and local dev (ADR 0008).

**2. Create `.sandcastle/.env`** (gitignored, never commit):

```
GH_TOKEN=<fine-grained token for pietgk/play>
```

Create the token at <https://github.com/settings/personal-access-tokens/new> with:
- Repository: `pietgk/play`
- Permissions: **Issues** (Read and write), **Metadata** (Read)

> `OPENAI_KEY` is not needed — Codex authenticates via your local `~/.codex` subscription credentials, which are bind-mounted into the container read-only.

### Running the agent

```bash
# Batch mode — drains all open Sandcastle-labelled issues (up to 3 per run)
pnpm sandcastle

# Single-issue mode — works one issue, useful for testing
pnpm sandcastle 42
```

### What happens under the hood

```
pnpm sandcastle
  ├─ fetches open Sandcastle-labelled issues from GitHub
  ├─ creates a git worktree (temp branch) on your machine
  ├─ starts sandcastle:play container with the worktree bind-mounted
  │    onSandboxReady:
  │      copies ~/.codex auth into the container
  │      nix develop -c pnpm install --frozen-lockfile
  ├─ Codex (inside container) works one issue:
  │    explores code, plans, implements (red-green-refactor)
  │    verifies: nix develop -c pnpm nx run-many --target=typecheck,test
  │    commits: RALPH: <summary>
  │    closes the issue via gh issue close
  ├─ Sandcastle merges the worktree branch → local HEAD
  └─ repeats for next issue (up to maxIterations)
```

The container never pushes to GitHub. Commits land on your **local** branch. Review them with `git log`, then `git push` and open PRs when you're satisfied.

### After the night shift

```bash
git log --oneline        # see what RALPH committed
pnpm nx affected -t test # verify everything still passes
git push                 # push when ready
```

---

## Issue workflow

Issues live in [GitHub Issues](https://github.com/pietgk/play/issues). The triage labels determine what happens to each issue:

| Label | Meaning | Next action |
|-------|---------|-------------|
| `needs-triage` | New, not yet evaluated | Maintainer reviews |
| `needs-info` | Waiting on more context | Reporter responds |
| `Sandcastle` | Fully specified, queued for Codex | `pnpm sandcastle` picks it up |
| `ready-for-human` | Needs human judgment or hands-on work | Human picks it up |
| `wontfix` | Will not be actioned | Closed |

Claude Code (interactive) creates and triages issues. Sandcastle (agent) works issues labelled `Sandcastle`.

**A well-written Sandcastle issue** gives the agent enough context to work autonomously:
- Clear acceptance criteria
- Relevant file paths or component names
- Reference to the parent PRD if it exists

---

## Architecture references

| Document | What it contains |
|----------|-----------------|
| `CONTEXT.md` | Domain glossary — the canonical vocabulary for this codebase. Read before opening an issue or writing code. |
| `docs/adr/` | Architectural Decision Records — *why* key decisions were made. Read ADRs that touch the area you're working in. |
| `docs/agents/` | Working agreements for AI agents (issue tracker, triage labels, domain doc conventions). |
| `CLAUDE.md` | Nx working agreement for Claude Code sessions. |

If you encounter something that looks wrong or surprising, check the ADRs before changing it — it may be intentional. If it contradicts an ADR, surface the conflict rather than silently overriding it.
