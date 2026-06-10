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
    env: { CODEX_HOME: sandboxCodexHome },
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
          command:
            "mkdir -p /home/agent/.codex && cp -r /mnt/host-codex/. /home/agent/.codex/",
        },
        { command: "nix develop -c pnpm install --frozen-lockfile" },
      ],
    },
  },
});
