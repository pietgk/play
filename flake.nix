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
              echo "play — node $(node --version), pnpm $(pnpm --version)"
            '';
          };
        }
      );
    };
}
