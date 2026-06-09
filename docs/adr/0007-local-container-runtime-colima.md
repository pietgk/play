# Local container runtime: Colima (brew-managed VM, flake-managed client)

**Status:** accepted

We need a local container runtime on this machine (Apple Silicon, macOS 26.5.1) for
real dev work — **devcontainers**, running a **database**, building/running the **OCI
images we deploy to AWS Fargate**, and sandboxing AI agents via
[Sandcastle](https://github.com/mattpocock/sandcastle) + Codex (e.g. to work GitHub
issues) — all without installing Docker Desktop. We chose **Colima** as the runtime,
installed via **Homebrew**, with the **`docker` client tooling in the Nix flake** and a
project-scoped **`DOCKER_HOST`** as the single source of truth.

## Decision

- **Runtime: Colima.** It exposes a real Docker API socket, so the `docker` CLI,
  `docker compose`, the `devcontainer` CLI, and Sandcastle's built-in Docker provider all
  work unchanged. This is the load-bearing reason.
- **The VM comes from Homebrew, the client from the flake (the "seam").** The
  Colima/Lima VM + its launchd daemon is *host infrastructure* (stateful, per-machine), so
  it lives outside the flake: `brew install colima`. The `docker` client, `docker compose`,
  and `docker buildx` are *toolchain* and go in `flake.nix` so every contributor and CI get
  the same client on PATH. Only "is the VM up?" (`colima start`) stays imperative.
- **Socket wiring: project-scoped `DOCKER_HOST`.** The devShell / `.envrc` exports
  `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock`. This makes the CLI, the
  `devcontainer` CLI, and the env-var-reading tools (Sandcastle, any future Testcontainers)
  resolve the *same* socket deterministically, instead of relying on global, drift-prone
  `docker context use`. Setting `DOCKER_HOST` makes contexts irrelevant — no second source
  of truth.
- **VM shape, committed to the repo.** `vmType: vz`, `rosetta: true`, 4 CPU / 8 GB RAM /
  100 GB disk. The colima profile config is version-controlled (`scripts/colima-up.sh`) so
  the VM's *shape* is reproducible even though the binary is brew-delivered.
- **"Fargate" is out of scope as a runtime concern.** The requirement is only *build & run
  the Fargate-bound OCI images locally* — the image doesn't know it'll land on Fargate, so
  plain Colima covers it. Emulating AWS *services* (LocalStack) or the Fargate task/IAM
  metadata contract is deferred until a concrete need appears.

## Considered options

- **Apple `container` (`brew install container`) — evaluated, rejected as primary.** It is
  native to this machine (Apple Silicon + macOS 26) and great for throwaway Linux shells
  (`container run -t -i alpine:latest sh`), but it has its *own* CLI surface, **no drop-in
  Docker API socket, and no compose** — so it cannot drive devcontainers or Sandcastle's
  Docker provider without writing a custom provider and giving up the devcontainer tooling.
  Kept as a documented, one-command deferred add for ad-hoc shells; not in the
  `DOCKER_HOST`/flake path. *Recording the rejection so it isn't re-litigated.*
- **Colima fully inside the Nix flake (pure-Nix) — rejected.** The binaries are in nixpkgs,
  but the nixpkgs build is **not code-signed with the `com.apple.security.virtualization`
  entitlement**, so `colima start --vm-type=vz` fails and falls back to **qemu** — slower,
  slower mounts, and **no Rosetta** ([colima#556](https://github.com/abiosoft/colima/issues/556)).
  Working around it means a fragile post-build codesign overlay, which is *less*
  reproducible than letting an already-signed artifact own the VM. A devShell also isn't a
  service manager, so `colima start` would stay imperative regardless.
- **nix-darwin owns everything — deferred, not rejected.** It is the genuinely
  consistent end state: it can declare `homebrew.brews = ["colima"]` and/or the colima
  launchd service, capturing the entitled-vz install *inside* Nix config. We chose the
  lower-setup brew-VM/flake-client split (Option A) for now; nix-darwin can later absorb the
  existing brew install (A → nix-darwin is a clean migration).

## Consequences

- **`vz` is the fast path; `rosetta` is ON, with qemu as the fallback.** `vz` (the default
  on macOS ≥13.5) gives native virtualization + `virtiofs`; turning it off would mean
  *slower* qemu, not leaner. We initially deferred `rosetta`, but testing showed the
  deferral's rationale ("lean/fast, arm64-first") was void: Rosetta only does work when an
  amd64 binary actually executes, so it is **zero-cost to the arm64-first workflow at rest**.
  The decision therefore reduced to one axis — when an amd64 image *does* appear (which we
  can't rule out), do we want it fast or slow? With `--vz-rosetta` it runs *fast*; without
  it, Colima's default `binfmt` still runs amd64 via qemu but ~5–10× slower (both verified —
  `docker run --platform linux/amd64 alpine` returns `x86_64` either way). So `rosetta` is
  **enabled**. The narrow case for off — a binary that runs under qemu but not Rosetta —
  remains a fallback (drop `--vz-rosetta` and recreate).
- **Two sharp edges Rosetta has, learned the hard way (the flag fails *silently*).**
  (1) **Host prerequisite:** Apple's Rosetta 2 must be installed
  (`softwareupdate --install-rosetta --agree-to-license`); without it, colima persists
  `rosetta: true` but Lima drops the share and falls back to qemu with **no error**.
  (2) **Creation-time only:** the vz Rosetta share is fixed when the instance is created, so
  enabling/disabling rosetta requires `colima delete && colima start`, *not* `stop && start`
  — the latter no-ops. Verify the result, don't trust the flag:
  `colima ssh -- cat /proc/sys/fs/binfmt_misc/rosetta` should name interpreter
  `/mnt/lima-rosetta/rosetta`.
- **The brew/Nix seam is intentional, not drift.** A future reader will see *both* Homebrew
  and Nix touching the container stack; that split is the decision above (host-infra VM vs.
  project toolchain client), not an oversight.
- **`docker` outside the project dir won't auto-target Colima.** That's by design — the
  runtime is scoped to this project via `DOCKER_HOST`. A login-shell export can be added
  later if ad-hoc, repo-less `docker` use is wanted.
- **Deferred levers, each cheap to pull:** Rosetta/amd64 (config flag + restart), LocalStack
  / Fargate task-metadata emulation (additive containers), Apple `container` for throwaway
  shells (`brew install container`), and migrating the whole install under nix-darwin.
