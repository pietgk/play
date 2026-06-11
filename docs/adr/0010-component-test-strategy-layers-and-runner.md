# Component test strategy: one concern per layer, story-as-scenario in the browser, jsdom retired

**Status:** accepted

The component test surface had grown by accretion and overlapped badly: `select.spec.ts`
(Vitest/jsdom TestBed) asserted combobox role, keyboard selection, intent emission and control
state; the Storybook `play` functions asserted the *same* behaviours in a real browser (reading a
hand-rolled `<dl>` panel); and `playground.spec.ts` (Playwright) drove the same keyboard paths a
*third* time and asserted the intent→Command mapping. The same concerns were tested in up to three
environments, and the least faithful one (jsdom) duplicated the most faithful one (real browser).
This ADR defines a single, non-overlapping layering, and pins the runner choice against current
tooling reality.

## Decision

- **One concern, one layer.** Every concern is tested in exactly one layer — the most faithful
  layer that can reach it — and never duplicated in a second environment:
  - **Pure logic** (Vitest, no DOM): the GWT `when`/`then` mapping, pure helpers, the token
    contract. The `when`/`then` mapping is owned **here and only here**.
  - **Story + `play`** (real browser): behaviour, data-flow and a11y. The story renders the
    **Given**, the `play` drives the **When** and asserts the **Then**. This single artifact is the
    behaviour test, the `design.md` drift guard ([0003](0003-design-md-authoring-workflow.md)) and
    the host for the Tier-1 axe gate ([0004](0004-accessibility-conformance-model.md)).
  - **Manual Tier-2 checklist** ([0004](0004-accessibility-conformance-model.md)): the non-automated
    conformance review.
  - **E2e** (Playwright): real app composition only — see the e2e boundary below.
- **jsdom component tests are retired.** Everything `select.spec.ts` asserted is behaviour/a11y
  that the `play` function tests more faithfully in a real browser. Vitest keeps only pure-logic
  tests (no DOM). The less-faithful environment does not duplicate the faithful one.
- **Two-tier tagged stories.** The *state* axis and the *interaction* axis are separated by
  Storybook tags rather than welded into one story:
  - **Showcase stories** — one per `design.md` state (`Default`, `Disabled`, `Invalid`, `Touched`).
    Autodocs-tagged (in the Docs page), axe-gated, minimal/no `play`. The design catalogue + drift
    guard + per-state a11y gate.
  - **Scenario stories** — one per interaction path (keyboard-select, mouse-select, typeahead,
    disabled-blocks, …). Tagged `test`/`!autodocs`/`!dev` (excluded from Docs and sidebar, run in
    the test-runner). Carry the `gwtRender` wiring and the heavy `play`.
- **Assertion split inside scenario `play`s.** A scenario asserts only the genuinely browser-only
  concerns: **(1)** the right **intent** fired (an `fn()` spy bound to the component's UI-intent
  output), and **(2)** the **rendered Then** (canvas/role query shows the new presented state). It
  does **not** assert the derived **Command** object — that mapping is pure and owned by the
  pure-logic layer. The Command remains visible in the Actions panel for teaching
  ([0009](0009-storybook-gwt-render-and-mdx-docs.md)), but visibility is not assertion.
- **E2e boundary: composition, not component existence.** E2e owns only what emerges from real app
  wiring — the page mounts, and the real round-trip (gesture → consumer dispatches an actual
  **Command** → real read model updates → component reflects it). **Leaf components** (compose no
  other DS component) get **no e2e**; **composite components** (Card, List, Master-Detail, Wizard,
  Dashboard, Bottom-tabs) and app surfaces are where e2e applies. E2e count tracks app *surfaces*,
  not components.
- **Runner: test-runner now, Vitest-mode when Angular-Vite ships.** As of June 2026,
  `@storybook/addon-vitest` (Vitest browser mode, the modern, recommended successor to
  `@storybook/test-runner`) is **Vite-only**; `@storybook/angular` is Webpack-based, and Storybook's
  own guidance is that Webpack/Angular projects should stay on the test-runner. The official
  `@storybook/angular-vite` framework is planned, not released. Therefore:
  - Keep `@storybook/test-runner` as the executor (already wired as `test-storybook`).
  - Use `test-storybook --watch` against a running dev Storybook as the TDD inner loop (the
    `run-storybook-tests.mjs` build-and-serve path is CI-shaped).
  - Migrate to `@storybook/addon-vitest` the moment `@storybook/angular-vite` (or a blessed AnalogJS
    path) is viable. Because the model is runner-agnostic, this is a **runner swap under the same
    stories**, not a rewrite.

## Considered options

- **Keep a thin TestBed/jsdom layer** — rejected: every concern it could own is more faithfully
  owned by the browser story layer; keeping it re-introduces the duplication this ADR removes.
- **One-tier stories (story = state, `play` carries all interaction)** — rejected: re-tangles docs
  with tests and forces multi-flow mega-`play`s; the tag split keeps the Docs page clean and lets
  interaction coverage grow independently.
- **Assert the Command object in the browser too** — rejected: duplicates the pure `when` test in a
  second environment for no added faithfulness.
- **Migrate to AnalogJS/Vite now to get addon-vitest immediately** — rejected for now: trades a real
  community-maintained-tooling and moving-target burden for a speed win largely recoverable via
  `--watch`; revisit when `@storybook/angular-vite` ships.

## Consequences

- "The story is the test scenario" becomes literally true; behaviour/a11y live where they are
  faithful, and the pure mapping is tested once, fast.
- Per-component test files are small: a pure `when`/`then` spec, a set of showcase stories, a set of
  scenario stories. Leaf components have no e2e at all.
- The slow inner loop is a **known, time-boxed limitation** tied to Angular-on-Webpack Storybook,
  not a design flaw; the migration target and its trigger are recorded so it is not forgotten.
- The Playground app's organisation as the component count grows (and the first composite arrives)
  is a deliberately deferred decision — to be grilled when the real forces exist, not guessed now.
