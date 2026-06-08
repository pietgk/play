# Data leg: domain-agnostic library, CQRS/ES confined to consumers and pluggable story wrappers

**Status:** accepted

The consuming system uses **CQRS/ES throughout** (Commands, Events, Query read models). The
Design System, however, must stay reusable across many apps and domains. If its public API
spoke in Commands/Events/read-model types, it would weld a generic library to one bounded
context and reusability would die.

## Decision

- **The presentational core is data-source-free *and* domain-agnostic.** Components receive
  data via plain injected signal `input()`s and emit **generic UI intent** via
  `output()`/`model()` (`valueChange`, `submit`, `select`) — **never** Commands, Events, or
  read-model types. No `HttpClient`/`resource()`/`httpResource()` inside core components.
- **The data leg maps to CQRS in the *consumer*, not the library:** inputs ← Query
  read-model projections (as signals); UI intent → the consumer translates to **Commands**;
  **Events** are write-side and invisible to components.
- **Signal forms:** library inputs/selects/checkboxes act as form *controls* (present
  invalid/touched/disabled state via inputs); they do **not** own validation or schema.
- **Storybook story wrappers are a pluggable harness.** The **GWT wrapper** (Given =
  read-model projection, When = interaction → Command, Then = render) is the first/preferred
  CQRS/ES wrapper. **Non-CQRS wrappers may be added later** as new wrapper types without
  changing components or existing stories. The same story set serves the `design.md` drift
  guard ([0003](0003-design-md-authoring-workflow.md)) and the a11y gate
  ([0004](0004-accessibility-conformance-model.md)).

## Considered options

- **CQRS types in the library API** — rejected: couples a generic library to one domain.
- **Domain-agnostic library, CQRS in consumer/wrapper — chosen.**

## Consequences

- The four legs stay honest: **design** (design.md/tokens), **behavior** (Aria),
  **data-in** (read-model-fed signals), **intent-out** (generic events → Commands in the
  consumer).
- The Playground demonstrates resource + signal-form + CQRS composition; the core never
  hardcodes it. "Fully embrace resources/forms" = composes well with them, does not own them.
