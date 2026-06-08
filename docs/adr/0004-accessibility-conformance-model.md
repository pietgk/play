# Accessibility: one WCAG 2.2 AA core, pluggable jurisdiction profiles, two-tier validation

**Status:** accepted

The Design System must carry an accessibility guarantee acceptable to enterprises and
governments, across **multiple jurisdictions that will grow over time**. Hardcoding to one
regulation, or claiming conformance from automated tooling alone, both fail that goal.

## Decision

- **One conformance core:** every component is built and tested against **WCAG 2.2 Level
  AA** — the single stable technical bar.
- **Pluggable jurisdiction profiles:** regulations (EN 301 549 for EU/government, Section
  508 for US federal, and future ones) are modelled as **profiles** that wrap the core and
  add their extras. Evidence is collected once against the core; each jurisdiction's
  **accessibility statement** is *derived* from that evidence plus its profile. New
  jurisdictions are added as new profiles **without changing components**.
- **Two-tier validation** (the starting point):
  - **Tier 1 — automated gate (blocking):** `@storybook/addon-a11y` (axe-core) +
    Storybook test-runner running axe **per story** in CI, tagged
    `wcag2a,wcag2aa,wcag21aa,wcag22aa`. One story per variant/state — the same story set
    is the `design.md` drift guard ([0003](0003-design-md-authoring-workflow.md)).
  - **Tier 2 — manual conformance checklist per component** (keyboard map, focus order, SR
    labels, reduced-motion, contrast), much of it pre-satisfied structurally by Angular
    Aria. The guarantee is **Tier 1 + Tier 2 signed off**, never Tier 1 alone.

## Consequences / future lever

- Automated tooling catches only ~30–50% of WCAG criteria today, which is *why* Tier 2
  exists. Prior research (by the author, in a previous role) estimated that **modern
  advanced testing + LLM assistance could raise automated coverage to ~75–95%**. We
  deliberately keep the option to **revisit that research and raise the Tier-1 ceiling**
  when time and need allow — it is recorded here so it is not forgotten, not committed now.
