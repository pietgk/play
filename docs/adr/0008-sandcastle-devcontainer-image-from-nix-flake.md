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
