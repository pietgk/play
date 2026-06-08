# Build on Angular 21.2 (preview Aria / experimental Signal Forms) until Nx supports Angular 22

**Status:** accepted

The Design System targets Angular v22 (where Aria, Signal Forms, and resources are stable —
released June 3, 2026). However, **Nx does not yet support Angular 22**: the official
Nx/Angular version matrix tops out at Angular ~21.2.0 (Nx ≥22.6.0), and upgrading the
workspace to v22 now would break the Nx/Angular integration. Nx is the non-negotiable build
platform here, so the framework upgrade is gated on Nx, not on Angular's release.

## Decision

- **Build now on Angular 21.2**, using **Angular Aria in developer preview** and **Signal
  Forms in experimental** — accepting that these APIs may change before stable.
- **Insulate consumers from that churn** via the thin gap-filler wrappers from
  [0001](0001-design-system-distribution-and-layering.md); that insulation is now
  load-bearing, not optional.
- **Two standing recon tasks** until the upgrade:
  1. Track the **v21-preview → v22-stable delta** for Aria and Signal Forms (source:
     `angular/components` CHANGELOG + Angular migration guide) so nothing in our public API
     depends on something that changed at stabilization.
  2. Track **when Nx adds Angular 22 support** (Nx changelog + version matrix). Upgrade the
     workspace via `nx migrate latest` as soon as it lands.

## Researched v21→v22 delta (recon task 1, closed with evidence)

Source: `angular/components` CHANGELOG, v22.0.0 (2026-06-03). The delta is **real and lands
on the first-wave directives**, so the insulation wrapper is warranted — and now scoped:

- **Aria — breaking:**
  - `values` → `value` input/model renamed across **Combobox, Listbox, Tree, Menu,
    Toolbar, Select** ("for signal forms compatibility"). Templates must change.
  - Legacy combobox & autocomplete **removed**; `SimpleCombobox` → `Combobox` (all
    `simple-combobox` symbols/selectors/tokens → `combobox`, e.g. `SIMPLE_COMBOBOX_POPUP`
    → `COMBOBOX_POPUP`); autocomplete now served via combobox.
  - Behavioral: "prevent form submissions in aria directives", "use eager change detection".
- **CDK a11y (Aria's base) — breaking:** `CDK_DESCRIBEDBY_HOST_ATTRIBUTE`,
  `CDK_DESCRIBEDBY_ID_PREFIX`, `MESSAGES_CONTAINER_ID` removed; `FocusTrap` /
  `ConfigurableFocusTrap` now require an `injector`; `ConfigurableFocusTrapFactory.create`
  boolean → config object; `ContextMenuTracker` → `MenuTracker`.
- **Aria — additive:** **test harnesses added for every pattern** (accordion, combobox,
  grid, listbox, menu, tabs, toolbar, tree) — these **do not exist in v21**.
- **Signal Forms — breaking:** `touched` model → `touched` input + `touch()` output;
  `disabled(field, fn)` → `disabled(field, {when: fn})`; `markAsTouched` semantics.
- **resource()/httpResource() — additive only** (`chain()`, `snapshot`, `debounced()`, SSR
  caching). **No wrapper needed; build against directly.**

## Consequences

- The wrapper is targeted at a **known, enumerated surface** (the `values`/`value` input,
  the combobox/autocomplete identity, the CDK a11y focus-trap/token changes), not
  speculative churn. Combobox/Autocomplete are the highest-risk to build on v21.
- **Aria test harnesses are v22-only**, so on v21 the a11y testing of ADR 0004 leans on
  Storybook + axe + `play` functions; component harnesses unlock at the upgrade.
- Build order: Listbox/Menu/Toolbar/Select first behind the wrapper (only `values`→`value`
  to absorb); defer/most-aggressively-wrap Combobox/Autocomplete; form controls carry the
  Signal Forms churn on top.
