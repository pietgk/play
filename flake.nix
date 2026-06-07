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

            shellHook = ''
              echo "play — node $(node --version), pnpm $(pnpm --version)"
            '';
          };
        }
      );
    };
}
