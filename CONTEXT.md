# Context

Domain language and shared understanding for this repo. The engineering skills read this
before exploring the codebase so their output uses the project's own vocabulary.

> **Status:** The workspace has a real deliverable now: a reusable, maintained **Design
> System** library for future Angular apps. The `play` app is repurposed as its
> **Playground**. Add terms here as real concepts emerge — `/grill-with-docs` will append
> to it lazily as decisions get resolved.

## What this is

The workspace has two distinct halves:

- **The Design System** — a maintained, reusable Angular component library, the actual
  product. Built for accessibility (validated to government/enterprise standards), headless
  behavior via Angular Aria, and consumed by future Angular apps. This is long-lived and
  carries a support obligation.
- **The Playground** (`apps/play`) — a free-form surface to test, discuss, demo, and
  **generatively** (chat / LLM-driven) experiment with components and with the
  fast-changing concepts the Design System adopts or invents. Throwaway by design; its job
  is exploration and demonstration, not stability.

The Playground exists *because* the product needs somewhere to be tried out by play and
demo. The two must not be conflated: changes to the Playground carry no compatibility
obligation; changes to the Design System do.

## Tech stack

- **Monorepo:** [Nx](https://nx.dev) 22.7 — projects live under `apps/` (and `libs/` once
  any exist). Run tasks via `nx` (`pnpm nx <target> <project>`), never the underlying tool
  directly. See `CLAUDE.md` for the Nx working agreement.
- **Framework:** Angular 21 (standalone components, signal-based APIs).
- **Package manager:** pnpm 11 (workspace pinned via `packageManager` in `package.json`).
- **Unit tests:** Vitest (with jsdom).
- **E2E tests:** Playwright (`apps/play-e2e`).
- **Lint/format:** ESLint (flat config, `eslint.config.mjs`) + Prettier.
- **Dev environment:** Nix flake (`flake.nix`) provides the toolchain; `direnv` (`.envrc`)
  loads it. `node_modules/.bin` is on the devShell PATH.

## Workspace layout

```
/
├── apps/
│   ├── play/        ← the Angular application (currently the default Nx welcome scaffold)
│   └── play-e2e/    ← Playwright e2e suite for `play`
├── docs/
│   ├── adr/         ← architectural decision records (see docs/agents/domain.md)
│   └── agents/      ← per-repo config the engineering skills read
├── CONTEXT.md       ← this file
├── CLAUDE.md / AGENTS.md  ← agent working agreements (Nx + Agent skills)
└── nx.json, pnpm-workspace.yaml, flake.nix, …
```

## Glossary

Domain concepts and the exact terms we use for them. One entry per concept; prefer the
term here over synonyms. (Empty for now — fill in as the project grows real vocabulary.)

| Term | Meaning |
| ---- | ------- |
| _Project_ (Nx) | A buildable/testable unit in the workspace — an app or a lib. Addressed by name in `nx` commands. |
| _Target_ (Nx) | A runnable task on a project (e.g. `build`, `test`, `lint`, `e2e`), inferred or defined in `project.json`. |
| _Design System_ | The maintained, reusable Angular component library — the product. Long-lived, accessibility-guaranteed, consumed by future apps. (Proper name TBD.) |
| _Playground_ | The `apps/play` app: free-form, throwaway surface for testing, demoing, and LLM/chat-driven generative experimentation with the Design System. No compatibility obligation. |
| _Three-leg separation_ | The principle that a component is split into three independent legs: **design** (look, via tokens), **behavior** (accessible interaction, via Angular Aria), and **data** (state/async, via signals, signal forms, resources). |
| _Design contract_ (`design.md`) | The authoritative statement of a component's **design leg**, written in the token vocabulary. Read by humans/LLMs to design and validate (descriptive), and read by an LLM to generate the concrete CSS implementation (generative). Owns design only — never behavior or data. |
| _Design language_ (`DESIGN.md`) | The system-level counterpart at the library root: global token vocabulary, design principles, a11y baseline, and naming conventions that every component's design contract draws on. |
| _Conformance core_ | The single stable technical accessibility bar every component is built and tested against: **WCAG 2.2 Level AA**. Independent of any one regulation. |
| _Jurisdiction profile_ | A pluggable mapping that wraps the conformance core for a specific regulation (e.g. EN 301 549, Section 508), adding its extras. New jurisdictions are added as new profiles without changing components. |
| _Accessibility statement_ | A per-component, per-jurisdiction conformance record derived from the two-tier validation evidence (automated + manual) plus the relevant jurisdiction profile. |
| _UI intent_ | A component's generic output (e.g. `valueChange`, `submit`, `select`) — what the user did, **not** a domain Command. The consumer maps UI intent → Command. The library's public API speaks UI intent only. |
| _Interaction state_ | Ephemeral UI state a component genuinely **owns** (expanded/collapsed, typeahead buffer, active descendant). May live in an internal signal store; mostly owned by Angular Aria. Never carries domain/data meaning. |
| _Presented state_ | The domain/data/control state a component **renders but never owns** (`value`, `options`, `invalid`, `touched`, `disabled`). Arrives via signal `input()` from a read-model projection; changes only by the component emitting UI intent. The store holding presented state is the **wrapper's or the consumer's**, never the component's. This is what keeps the data leg honest ([0005](docs/adr/0005-domain-agnostic-library-cqrs-in-consumers.md)). |
| _CQRS/ES_ | The system-wide architecture of the consuming apps: **Commands** (intents to change state), **Events** (immutable facts of what happened), **Query read models** (projections read by the UI). Lives in consumers, never in the Design System's type surface. |
| _Story wrapper_ | A pluggable Storybook harness that supplies a component's data and context for a story. The **GWT wrapper** (Given = read-model projection, When = interaction → Command, Then = component renders) is the first/preferred, CQRS/ES-based wrapper; **non-CQRS wrappers** can be added later as new types. |
| _Leaf component_ | A component that composes **no other Design System components** (e.g. Select, Button, Checkbox). Its full coverage is pure-logic + showcase + scenario tests; it gets **no e2e**. |
| _Composite component_ | A component that **composes other Design System components** (e.g. Card, List, Master-Detail, Swipeable card list, Wizard, Dashboard, Bottom-tabs). Composition behaviour that only emerges from real wiring is the one thing **e2e** owns. |
| _One concern, one layer_ | Test-strategy rule: every concern is tested in exactly **one** layer — the most faithful layer that can reach it — and never duplicated in a second environment. Pure logic → Vitest (no DOM); behaviour/data-flow/a11y → Storybook story+`play` in a real browser (jsdom component tests retired); real app composition → Playwright e2e (composites/surfaces only). |
| _Showcase story_ | A story rendering **one `design.md` state** (Given only). Tagged for autodocs; it is the design catalogue, the `design.md` drift guard ([0003](docs/adr/0003-design-md-authoring-workflow.md)) and the per-state axe gate ([0004](docs/adr/0004-accessibility-conformance-model.md)). Minimal/no `play`. |
| _Scenario story_ | A story exercising **one interaction path** (Given→When→Then) via `gwtRender`. Tagged `test`/`!autodocs` (excluded from docs), it asserts only the browser-only concerns — the **intent fired** (spy) and the **rendered Then** (canvas) — never the pure Command mapping. |

## Conventions

- All task execution goes through Nx; prefer `nx affected` in CI-like flows.
- New projects are scaffolded with Nx generators, not by hand (`/nx-generate`).
- Issues and PRDs are tracked in GitHub Issues — see `docs/agents/issue-tracker.md`.
