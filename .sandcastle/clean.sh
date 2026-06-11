#!/usr/bin/env bash
#
# sandcastle:clean — sweep stale Sandcastle worktrees + merged worker branches.
#
# Sandcastle preserves any worktree whose `git status --porcelain` is non-empty
# (Orchestrator cleanupWorktree), so a crashed or incomplete run never silently
# discards the agent's work. There is no GC for those preserved worktrees — they
# accumulate under .sandcastle/worktrees/ until removed by hand. This script is
# that hand.
#
# Default (safe): removes only worktrees that are CLEAN or whose branch is fully
# merged into the base branch, and deletes merged `sandcastle/worker/*` branches.
# Worktrees with un-merged uncommitted work are KEPT and printed — that is real,
# unsaved agent output you might still want.
#
#   pnpm sandcastle:clean            # safe sweep
#   pnpm sandcastle:clean --force    # also force-remove dirty/un-merged worktrees
#
set -euo pipefail

FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BASE_BRANCH="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')"
BASE_BRANCH="${BASE_BRANCH:-main}"

WT_PREFIX="$REPO_ROOT/.sandcastle/worktrees/"

removed=0
kept=0

# --- worktrees -------------------------------------------------------------
# Parse `git worktree list --porcelain` block-by-block.
wt="" head="" branch=""
flush() {
  [[ -z "$wt" ]] && return 0
  case "$wt" in
    "$WT_PREFIX"*) ;;            # only touch Sandcastle worktrees
    *) wt=""; head=""; branch=""; return 0 ;;
  esac

  local dirty=0 merged=0 ref
  [[ -n "$(git -C "$wt" status --porcelain 2>/dev/null)" ]] && dirty=1
  ref="${branch:-$head}"        # detached worktrees match on their HEAD sha
  git merge-base --is-ancestor "$ref" "$BASE_BRANCH" 2>/dev/null && merged=1

  if [[ $dirty -eq 0 || $merged -eq 1 || $FORCE -eq 1 ]]; then
    git worktree remove --force "$wt"
    echo "  removed  ${wt#"$WT_PREFIX"}  (dirty=$dirty merged=$merged)"
    removed=$((removed + 1))
  else
    echo "  KEPT     ${wt#"$WT_PREFIX"}  — uncommitted, un-merged work"
    echo "             review: cd $wt   then re-run with --force to drop it"
    kept=$((kept + 1))
  fi
  wt=""; head=""; branch=""
}

while IFS= read -r line; do
  case "$line" in
    "worktree "*) flush; wt="${line#worktree }" ;;
    "HEAD "*)     head="${line#HEAD }" ;;
    "branch "*)   branch="${line#branch refs/heads/}" ;;
    "")           flush ;;
  esac
done < <(git worktree list --porcelain)
flush

git worktree prune

# --- branches --------------------------------------------------------------
# Delete merged worker branches; keep (and report) un-merged ones.
while IFS= read -r b; do
  [[ -z "$b" ]] && continue
  if git merge-base --is-ancestor "$b" "$BASE_BRANCH" 2>/dev/null; then
    git branch -D "$b" >/dev/null && echo "  deleted branch  $b"
  else
    echo "  kept branch     $b  — not merged into $BASE_BRANCH"
  fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads/sandcastle/worker)

echo "Done — removed $removed worktree(s), kept $kept."
