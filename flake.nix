{
  description = "play — Nx/Angular dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems =
        f:
        nixpkgs.lib.genAttrs systems (
          system:
          f {
            pkgs = import nixpkgs { inherit system; };
          }
        );
    in
    {
      devShells = forAllSystems (
        { pkgs }:
        {
          default = pkgs.mkShell {
            # Tool layer only. node_modules is resolved by pnpm inside this
            # shell (networked), never built as a Nix derivation — so Nx's
            # caching never collides with Nix's build sandbox.
            packages = with pkgs; [
              nodejs_24
              pnpm
              git
              gh

              # Docker *client* tooling only — the Colima/Lima VM + daemon are
              # host infrastructure installed via Homebrew (see ADR 0007), so
              # they are deliberately NOT here. These are the clients our
              # scripts, the devcontainer CLI, and Sandcastle invoke.
              docker-client
              docker-buildx
              docker-compose
            ];

            # Playwright browsers come from nixpkgs (autopatched to run in the
            # nix env — no system libs / `playwright install --with-deps`).
            # The npm @playwright/test version MUST match this driver version
            # (pinned together): playwright-driver = ${pkgs.playwright-driver.version}.
            PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
            PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";

            shellHook = ''
              # Put the project's local CLIs (nx, ng, ...) on PATH so they can
              # be run bare instead of via `pnpm exec`.
              export PATH="$PWD/node_modules/.bin:$PATH"

              # Single source of truth for the container runtime (ADR 0007):
              # point every Docker client at Colima's socket explicitly, so the
              # docker CLI, the devcontainer CLI, and env-var-reading tools
              # (Sandcastle, future Testcontainers) all resolve the SAME daemon.
              # Setting DOCKER_HOST makes `docker context` irrelevant — no drift.
              export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"

              # The buildx/compose CLI plugins come from Nix, not from the
              # Colima install. Point DOCKER_CONFIG at a project-local dir whose
              # cli-plugins/ holds them, so `docker buildx` / `docker compose`
              # resolve as subcommands — project-scoped and reproducible.
              export DOCKER_CONFIG="$PWD/.docker"
              mkdir -p "$DOCKER_CONFIG/cli-plugins"
              ln -sf ${pkgs.docker-buildx}/bin/docker-buildx "$DOCKER_CONFIG/cli-plugins/docker-buildx"
              ln -sf ${pkgs.docker-compose}/bin/docker-compose "$DOCKER_CONFIG/cli-plugins/docker-compose"

              echo "play — node $(node --version), pnpm $(pnpm --version), docker $(docker --version 2>/dev/null | awk '{print $3}' | tr -d ,)"
            '';
          };
        }
      );
    };
}
