# Sandcastle + devcontainer image built from the Nix flake

**Status:** accepted

The project's Nix flake is the single source of truth for the toolchain — host dev and CI both use `nix develop -c <command>`, and the CI workflow explicitly notes "no second place to drift." The Sandcastle coding-agent sandbox needs the same guarantee: running `pnpm nx test` in the container must behave identically to running it in CI. A plain `node:22-bookworm` or `node:24-bookworm` base breaks that contract by creating a third, manually-maintained environment.

We therefore build **one image** from the Nix flake — pre-warming the Nix store at image-build time — and use it for both Sandcastle (the Codex night-shift agent) and the devcontainer.

## Decision

- **Image source: this repo's flake.** `flake.nix` + `flake.lock` are copied into the Dockerfile; `nix develop` runs during `docker build` to pull and cache the exact pinned derivations (nodejs_24, pnpm, git, gh, etc.). When `flake.lock` changes the Docker layer cache invalidates and a fresh build picks up the new pins automatically — no manual version tracking.
- **Codex CLI installed on top of the Nix layer.** The Nix devshell provides the project toolchain; `@openai/codex` is installed globally via `npm install -g` in the same image. One image serves both consumers.
- **Image lives in this repo, CI builds and pushes to `ghcr.io`.** Not a separate repo — the image is inseparable from the flake it was built from. A `docker build && push` job runs on changes to `flake.lock`, `.sandcastle/Dockerfile`, or `.devcontainer/`.
- **Runtime credentials are never baked in.** `GH_TOKEN` comes from `.sandcastle/.env` (gitignored). `~/.codex` auth is bind-mounted read-only at runtime and copied to the agent home on sandbox start — matching the approach in the [Sandcastle + Codex blog post](https://www.eddyvinck.com/blog/how-to-set-up-sandcastle-with-codex/).
- **Nix sandbox flag.** Docker's own build sandbox conflicts with Nix's internal sandbox; the Dockerfile sets `sandbox = false` in `/etc/nix/nix.conf` to allow the `nix develop` pre-warm to succeed inside a `docker build`.

## Considered options

- **`node:24-bookworm` with manual pnpm pin** — rejected. Approximates the flake but doesn't track it. A `nix flake update` that bumps the Node or pnpm version silently diverges from the container until someone notices. This is exactly the drift CI was designed to prevent.
- **Separate image repo** — rejected. The image has no meaning outside this flake; versioning it independently creates unnecessary indirection and maintenance overhead.

## Consequences

- `sandcastle docker build-image` is slow the first time (Nix store download). Subsequent builds with a warm Docker layer cache are fast. The CI-built image on `ghcr.io` means contributors and the sandbox pull a pre-built image rather than rebuilding from scratch.
- The devcontainer and Sandcastle share one image but have different mount conventions: devcontainer bind-mounts the workspace; Sandcastle uses its worktree copy mechanism. Both work against the same pre-warmed Nix store.
- Any future CI worker running this container (e.g. a GitHub Actions job that uses the devcontainer) gets the same environment for free.

## Amendment (2026-06-10): implementation corrected to match the decision

The first implementation (commit `3c7293b`) silently violated this ADR in two ways, and both surfaced on the very first agent run:

1. **It used `FROM node:22-bookworm`** — the exact "third, manually-maintained environment" the decision above rejects. The base image baked in Node 22 + npm alongside the flake's `nodejs_24`.
2. **Nix was only placed on `ENV PATH`**, never baked into login shells. Sandcastle runs hooks via `docker exec … sh -c` (which inherits `ENV`, so the setup hook found Nix), but the Codex agent runs every command via `bash -lc` — a login shell whose `/etc/profile` resets PATH. Result: the agent got `nix: command not found` and **silently fell back to the base image's Node 22**, the precise drift this ADR exists to prevent. A bare `nix develop` in the agent also failed because the bind-mounted worktree's `.git` points at a host path absent in the container (`git+file` resolution error).

**Corrective decisions (now implemented and build-validated):**

- **Base is `debian:bookworm-slim`, not a Node image and not `nixos/nix`.** Node/pnpm/git/gh come *only* from the flake. Debian (over `nixos/nix`) is deliberate: it keeps VS Code-server / devcontainer compatibility (standard glibc FHS), easy host UID/GID alignment for the bind-mounted worktree, and single-user daemonless Nix. `nixos/nix` was rejected — its sparse non-FHS userland breaks the devcontainer reuse and complicates the UID/GID dance.
- **The devshell is baked into *every login shell*.** At build time `nix print-dev-env` captures the full devshell environment (PATH, `PLAYWRIGHT_*`, `NIX_*`) into `/home/agent/.devshell-env.sh`, sourced from `/etc/profile.d/10-devshell.sh`. The host-only `shellHook` (Colima / `DOCKER_HOST` wiring) is stripped. The container therefore *is* the devshell — agents run bare `pnpm nx …` and get the flake-pinned tools; nobody runs `nix develop` against the worktree cwd, so the `git+file` error cannot recur.
- **Codex installs on the flake's Node** into a writable npm prefix (`/home/agent/.npm-global`), since the Nix store is read-only.
- **Sandcastle hooks are wrapped in `bash -lc`** so they enter the baked devshell (plain `sh -c` does not source `/etc/profile`).

The original Decision bullets above (image source = flake, Codex on top, ghcr build, no baked credentials, `sandbox = false`) all still hold; this amendment corrects only the base image and how the devshell reaches every shell.

**Stale-image drift — `pnpm sandcastle` now rebuilds first.** A run (`pnpm sandcastle`) only *inspects* that the `sandcastle:play` image exists; it never builds it. Building is the separate `sandcastle docker build-image`. So after a `flake.lock` or `Dockerfile` change, a run silently reused the previously-built image — the same drift, one layer down (it's how the first run on the corrected Dockerfile still failed: the old `node:22` image was still cached). The `sandcastle` script now runs `sandcastle:build && tsx …`, so every run rebuilds first. Docker's layer cache makes this a few seconds when nothing changed, and a real rebuild precisely when `flake.lock`/`Dockerfile` did — the image can no longer lag the flake.
