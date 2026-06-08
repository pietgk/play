# `design.md`: LLM-readable design contract, scaffolded-once then owned, tests as drift guard

**Status:** accepted

Each component separates into three independent legs — **design**, **behavior** (Angular
Aria), **data** (signals / signal forms / resources). We capture the **design leg** in a
`design.md` "design contract" written in the token vocabulary
([0002](0002-tokens-first-styling-contract.md)), authored by and for humans + LLMs (Claude).
The hard question this answers: since LLM generation is **not deterministic**, generated CSS
cannot be treated as a disposable, regenerable build artifact.

## Decision

- `design.md` is the **authoritative source of truth for design intent**, consumed two ways:
  **descriptively** (humans/LLMs read it to design and validate; Storybook + a11y tests
  assert against it) and **generatively** (Claude reads it to produce the concrete CSS).
- Generation is **guided authoring, not a build step**: Claude scaffolds the CSS from
  `design.md` **once**, a human reviews and commits it, and from then on **the CSS is owned,
  hand-refinable code**. When design changes, update `design.md` first, then regenerate
  **only the affected variant** (small reviewable diffs) — never a wholesale re-emit.
- The **drift guard is the test layer, not regeneration**: CI asserts every variant/state
  declared in `design.md` has a Storybook story + a11y assertion, so divergence surfaces as
  a failing test rather than silent rot.
- `design.md` owns **design only** — never behavior (Aria) or data.

## Considered options

- **(i) Committed CSS, design.md as a side spec** — rejected: design.md rots silently.
- **(ii) Pure generated output, never hand-edited** — rejected: LLM non-determinism makes
  regeneration fragile and discards hand-refinements.
- **(iii) Authoritative intent + scaffold-once-then-own + tests as guard — chosen.**

## Consequences

- Components are **scaffolded** from `design.md`, then owned — *not* cheaply regenerable.
  Anyone treating them as throwaway regenerable output will fight the workflow.
- Placement (root `DESIGN.md` + per-entry-point `design.md`) is the **provisional starting
  hypothesis**, to be revised from real experience — deliberately not locked here.
