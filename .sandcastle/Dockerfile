FROM node:22-bookworm

# System dependencies + GitHub CLI
RUN apt-get update && apt-get install -y \
  curl \
  xz-utils \
  jq \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
     | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
     | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# Install Codex CLI on the system Node (run as root before user switch)
RUN npm install -g @openai/codex

# Build-args for UID/GID alignment with the host user
ARG AGENT_UID=1000
ARG AGENT_GID=1000

RUN groupmod -o -g $AGENT_GID node \
  && groupmod -n agent node \
  && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node

# Pre-create /nix owned by agent so single-user Nix can write there without root
RUN mkdir -p /nix && chown agent:agent /nix

USER ${AGENT_UID}:${AGENT_GID}

# Install Nix single-user (no daemon — the clean Docker pattern)
RUN curl --proto '=https' --tlsv1.2 -sSfL https://nixos.org/nix/install | sh -s -- --no-daemon

# Put the Nix profile on PATH for subsequent RUN steps and the running container
ENV PATH="/home/agent/.nix-profile/bin:${PATH}"

# Enable flakes; disable Nix's internal sandbox (conflicts with Docker's overlay FS)
RUN mkdir -p /home/agent/.config/nix \
  && printf "experimental-features = nix-command flakes\nsandbox = false\n" \
     > /home/agent/.config/nix/nix.conf

# Copy flake files to pre-warm the Nix store at image-build time.
# When flake.lock changes, this layer invalidates and a fresh build pulls the new pins.
COPY --chown=agent:agent flake.nix flake.lock /tmp/flake-prime/

RUN nix develop /tmp/flake-prime --no-write-lock-file --command echo "Nix devshell pre-warmed"

WORKDIR /home/agent

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
ENTRYPOINT ["sleep", "infinity"]
