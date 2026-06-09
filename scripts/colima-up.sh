#!/usr/bin/env bash
# Bring up the local container runtime (ADR 0007).
#
# Run this from INSIDE the Nix dev shell (`nix develop` / direnv): Colima's
# startup dependency-check needs the `docker` client on PATH, and that client
# lives in the flake, not globally.
#
# Colima itself is Homebrew-managed host infrastructure; this script is the
# version-controlled definition of the VM's *shape*, so the engine settings are
# reproducible even though the engine binary is delivered by brew.
#
#   vm-type vz : native Apple Virtualization.framework (fast virtiofs mounts) —
#                the lean path on Apple Silicon, NOT a heavier option than qemu.
#   rosetta    : ON. Zero cost to arm64-first work (only engages when an amd64
#                binary executes); makes the amd64 case fast instead of slow qemu.
#                PREREQUISITE: host Rosetta 2 must be installed
#                  (`softwareupdate --install-rosetta --agree-to-license`)
#                or Lima SILENTLY falls back to qemu (no error — verify with
#                `colima ssh -- cat /proc/sys/fs/binfmt_misc/rosetta`).
#                Toggling rosetta only takes effect on a FRESH instance — the vz
#                share is set at creation, so changing it needs
#                `colima delete && colima start`, not just stop/start.
#                If a binary ever breaks under Rosetta, drop --vz-rosetta and
#                recreate to fall back to qemu binfmt.
set -euo pipefail

colima start \
  --vm-type vz \
  --vz-rosetta \
  --cpus 4 \
  --memory 8 \
  --disk 100

echo
echo "Colima up. The dev shell points DOCKER_HOST at its socket."
echo "Verify (inside the Nix dev shell):  docker info"
