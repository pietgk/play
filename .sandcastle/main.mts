import { run, codex } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import os from "node:os";
import path from "node:path";

// Run modes:
//   pnpm sandcastle          — batch: drains all open Sandcastle-labelled issues
//   pnpm sandcastle 42       — single: works issue #42 only, one iteration

const issueNumber = process.argv[2];

const LIST_TASKS_COMMAND = issueNumber
  ? `gh issue view ${issueNumber} --json number,title,body,labels,comments --jq '[{number: .number, title: .title, body: .body, labels: [.labels[].name], comments: [.comments[].body]}]'`
  : `gh issue list --state open --label Sandcastle --limit 100 --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`;

const hostCodexHome = path.join(os.homedir(), ".codex");
const sandboxCodexHome = "/home/agent/.codex";

await run({
  name: "worker",

  sandbox: docker({
    env: {
      CODEX_HOME: sandboxCodexHome,
      // The worktree is bind-mounted (virtiofs); Nx's native task DB can't
      // live there, so point cache + workspace-data at container-local paths.
      // This bakes in the workaround the agent otherwise rediscovers each run.
      // Combined with NX_CLOUD_ACCESS_TOKEN (forwarded via .sandcastle/.env),
      // cached runs hit the shared Nx Cloud cache instead of being skipped.
      NX_CACHE_DIRECTORY: "/home/agent/.nx/cache",
      NX_WORKSPACE_DATA_DIRECTORY: "/home/agent/.nx/workspace-data",
    },
    mounts: [
      {
        hostPath: hostCodexHome,
        sandboxPath: "/mnt/host-codex",
        readonly: true,
      },
    ],
  }),

  agent: codex("gpt-5.5"),

  promptFile: "./.sandcastle/prompt.md",
  promptArgs: { LIST_TASKS_COMMAND },

  maxIterations: issueNumber ? 1 : 3,

  branchStrategy: { type: "merge-to-head" },

  hooks: {
    sandbox: {
      onSandboxReady: [
        {
          // Copy ONLY the credential, not the whole host ~/.codex. The host dir
          // carries 213MB of machine-local state — sessions/, logs, caches, and
          // a state.db whose rows map thread IDs to host-absolute rollout paths
          // (/Users/grop/.codex/sessions/…). Inside the Linux container those
          // paths don't exist, so codex's startup `rollout::list` fails with
          // "stale rollout path" and exits before reading the prompt. config.toml
          // is just as toxic here (it pins CODEX_HOME=/Users/grop/.codex and host
          // plugin/notify paths). auth.json is the only thing the container needs;
          // codex regenerates a clean state db per run. (ADR 0008.)
          command:
            "mkdir -p /home/agent/.codex && cp /mnt/host-codex/auth.json /home/agent/.codex/auth.json",
        },
        // The image bakes the Nix devshell into every login shell (ADR 0008),
        // so `pnpm` is the flake's pnpm. Hooks run via `sh -c`, which does not
        // source /etc/profile — wrap in `bash -lc` to enter the devshell.
        { command: "bash -lc 'pnpm install --frozen-lockfile'", timeoutMs: 300_000 },
      ],
    },
  },
});
