# syntax=docker/dockerfile:1

# =============================================================================
# Sandcastle / devcontainer image — built FROM the Nix flake (ADR 0008)
# =============================================================================
# The flake is the single source of truth for the toolchain. Host dev and CI
# run `nix develop -c <cmd>`; this image bakes the SAME devshell in, so running
# `pnpm nx test` here behaves identically — "no second place to drift."
#
# Base is debian-slim, NOT a node image. ADR 0008 explicitly rejects a
# node:*-bookworm base: it bakes in a second Node that silently shadows the
# flake's nodejs_24 whenever Nix isn't on PATH (the exact bug this replaces).
# Node, pnpm, git, gh all come from the flake. Debian (over nixos/nix) keeps
# VS Code-server / devcontainer compatibility, easy host UID/GID alignment for
# the bind-mounted worktree, and single-user (daemonless) Nix.
# =============================================================================

FROM debian:bookworm-slim

# Bootstrap layer: only what the Nix installer itself needs, plus sudo (the
# devcontainer convention). Everything else is provided by Nix — no apt Node.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      xz-utils \
      sudo \
  && rm -rf /var/lib/apt/lists/*

# UID/GID aligned with the host user so the bind-mounted worktree keeps correct
# ownership (Sandcastle mounts the worktree at /home/agent/workspace).
ARG AGENT_UID=1000
ARG AGENT_GID=1000

RUN groupadd -o -g "${AGENT_GID}" agent \
  && useradd -o -u "${AGENT_UID}" -g "${AGENT_GID}" -m -d /home/agent -s /bin/bash agent \
  && echo 'agent ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/agent \
  && chmod 0440 /etc/sudoers.d/agent

# Pre-create /nix owned by agent so single-user Nix can write there as non-root.
RUN mkdir -p /nix && chown agent:agent /nix

USER ${AGENT_UID}:${AGENT_GID}

# npm global prefix on a writable dir — the flake's Node lives in the read-only
# Nix store, so `npm install -g` (Codex, below) must target a user-owned prefix.
ENV NPM_CONFIG_PREFIX=/home/agent/.npm-global

# PATH for the build-time RUN steps and for `sh -c` hooks at runtime (docker
# exec inherits the image ENV): the Codex CLI (npm-global) and the Nix client.
# The full devshell toolchain is layered on top via /etc/profile.d (below).
ENV PATH="/home/agent/.npm-global/bin:/home/agent/.nix-profile/bin:${PATH}"

# Install single-user Nix (no daemon — the clean Docker pattern).
RUN curl --proto '=https' --tlsv1.2 -sSfL https://nixos.org/nix/install | sh -s -- --no-daemon

# Enable flakes; disable Nix's internal sandbox (conflicts with Docker's overlay FS).
RUN mkdir -p /home/agent/.config/nix \
  && printf "experimental-features = nix-command flakes\nsandbox = false\n" \
     > /home/agent/.config/nix/nix.conf

# Non-git copy of the flake so Nix never resolves a `git+file` input. (The
# worktree's .git points at a host path absent in the container; a cwd-based
# `nix develop` would fail on it — the original Sandcastle error.)
COPY --chown=agent:agent flake.nix flake.lock /home/agent/flake-prime/

# Realize the devshell (pins nodejs_24 / pnpm / git / gh per flake.lock) and
# capture its full environment — PATH, PLAYWRIGHT_*, NIX_* — into a sourceable
# script. Generated INSIDE the build so the baked store paths are linux, not
# the host's. We drop print-dev-env's trailing `eval "${shellHook}"`: the host
# shellHook wires Colima / DOCKER_HOST and is meaningless (and noisy) here.
RUN nix develop /home/agent/flake-prime --no-write-lock-file -c true \
  && nix print-dev-env /home/agent/flake-prime --no-write-lock-file \
       | grep -vE '^[[:space:]]*eval "\$\{?shellHook' \
       > /home/agent/.devshell-env.sh

# Codex CLI — installed with the flake's Node (from the devshell env) into the
# writable npm prefix on PATH above.
RUN bash -c '. /home/agent/.devshell-env.sh && npm install -g @openai/codex'

# Make every login shell enter the devshell. The Codex agent and the Sandcastle
# hooks (wrapped in `bash -lc` from main.mts) are login shells, so they source
# /etc/profile -> /etc/profile.d/*. The heavy devshell script is bash-only
# (uses `declare -x`), hence the BASH_VERSION guard.
USER 0:0
RUN printf '%s\n' \
  '# Enter the Nix devshell baked at image build (ADR 0008).' \
  'if [ -n "$BASH_VERSION" ] && [ -f /home/agent/.devshell-env.sh ]; then' \
  '  . /home/agent/.devshell-env.sh' \
  'fi' \
  '# Keep the Codex CLI (npm global) and single-user Nix on PATH in login shells.' \
  'PATH="/home/agent/.npm-global/bin:/home/agent/.nix-profile/bin:$PATH"' \
  '# Project-local CLIs (nx, ng) when working inside the workspace.' \
  'case ":$PATH:" in' \
  '  *":/home/agent/workspace/node_modules/.bin:"*) ;;' \
  '  *) PATH="/home/agent/workspace/node_modules/.bin:$PATH" ;;' \
  'esac' \
  'export PATH' \
  > /etc/profile.d/10-devshell.sh \
  && chmod 0644 /etc/profile.d/10-devshell.sh

USER ${AGENT_UID}:${AGENT_GID}
WORKDIR /home/agent

# Sandcastle bind-mounts the worktree at /home/agent/workspace and overrides the
# working dir there at container start.
ENTRYPOINT ["sleep", "infinity"]
