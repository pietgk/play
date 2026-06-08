# Design System: versioned dependency, not copy-paste; Aria-as-brain, single styled layer

**Status:** accepted

We are building a maintained Angular **Design System** (the product) with an accessibility
guarantee to government/enterprise standards, consumed by future apps. We took **spartan/ui
(shadcn) as inspiration**, but **explicitly rejected its copy-paste/registry distribution
model**: a maintained a11y guarantee is unenforceable on code consumers own and can fork.
The guarantee must travel with a versioned dependency we patch centrally.

## Decision

- **Distribution:** ship as a real **versioned dependency**, not vendored source. Build it
  as an Nx **publishable** library consumed **in-workspace** today (Nx path imports, no
  semver yet), architected so `nx release` publishing to npm is a clean extraction the day
  a second repo needs it. spartan is inspiration for **internal structure and DX only**.
- **Layering:** **Angular Aria (stable in v22) is the headless "brain"** (behavior, focus,
  keyboard, ARIA — built on `@angular/cdk/a11y`). We do **not** rebuild a spartan-style
  brain layer. We own a **single styled layer** on top of Aria, adding a thin internal
  wrapper **only** as an "Aria gap-filler" where Aria is insufficient or where we want to
  insulate our public API from Aria's residual preview→stable churn.
- **Project shape:** a single publishable lib **`libs/ui`** using **ng-packagr secondary
  entry points** (`@play/ui/button`, `@play/ui/dialog`, `@play/ui/tokens`, …) rather than
  one Nx project per component. `apps/play` (the Playground) consumes `@play/ui/*`.

## Considered options

- **(a) In-workspace publishable lib, extractable later — chosen.**
- **(b) Publish versioned npm packages now** — deferred until a second repo exists; (a)
  promotes to (b) cheaply.
- **(c) shadcn/spartan copy-paste registry** — rejected: breaks the central a11y guarantee.

## Consequences

- Secondary entry points mean **one shared version** for all components (acceptable while
  consumed in-workspace; revisit at first external publish).
- The a11y guarantee is enforceable because shipped code is the code we test.
- Per-app customization (the ergonomic spartan promised) must be delivered by **headless
  Aria + theming/`design.md`**, not by letting consumers fork source.
