# Storybook realization of the GWT wrapper: render factory over the real component, native panels, MDX docs

**Status:** accepted

[0005](0005-domain-agnostic-library-cqrs-in-consumers.md) established that the GWT wrapper is a
pluggable Storybook harness (Given = read-model projection, When = UI intent → Command, Then =
render). It did not say *how* that harness is realized in Storybook. The first implementation made
the harness a **host component** (`SelectGwtStory`) and set it as the story's `component`. The
consequence: Controls and autodocs described the *harness*, not the component; a hand-rolled `<dl>`
re-implemented state Storybook already tracks; and "the GWT itself as a story" stopped being
understandable — the component was buried inside its wrapper.

## Decision

- **The story subject is the real component.** `meta.component = Select` (etc.). `args` are the
  component's real `input()`s, so Controls and the API table reflect the actual public surface.
- **GWT is a `gwtRender` factory, not a host component.** A reusable factory returns a `meta.render`
  that binds the real component to `args` and wires the UI-intent `output()` **by name through
  `props`** (a `[output]: handler` entry) — not a custom `template`. `@storybook/angular` does **not**
  deliver function-valued args to a `render`, so the factory **owns the intent spy in its closure**
  and exposes it for scenario plays; `meta.beforeEach` calls `reset()` to isolate it per story. The
  handler runs `when()` to log the Command (see below). Non-CQRS wrappers (per 0005) become
  alternative factories without touching components or stories.
- **The CQRS flow is shown through native panels, not custom canvas chrome:**
  - **Given → Controls** (`args`, seeded from a read-model projection).
  - **When → Actions** — the factory's handler logs the **UI intent** and the **derived Command** as
    two actions, side by side.
  - **Then → Canvas** — handled natively by the component's `model()` two-way binding (`value`),
    which re-renders the canvas and updates the value Control. (No explicit `then()` reducer is
    needed for a `model`-based control; `createGwtStoryWrapper` remains the reference machinery for
    richer read models a future non-`model` component may need.) The **Interactions** panel steps the
    `play` assertions.
  - The previous in-canvas `<dl>` readout is **removed**; nothing renders in the canvas but the
    component.
- **Docs are one MDX page per component, with the design leg imported, not re-authored.** The page
  uses `<Meta of={…}>` and Doc Blocks (`<Controls>`, `<Canvas>`, `<ArgTypes>`), and renders the
  component's `design.md` as an imported raw string so `design.md` stays the single source of truth
  for the design leg ([0003](0003-design-md-authoring-workflow.md)). The import is matched **by
  path** (`.md` → webpack `asset/source` in `.storybook/main.ts`), not via a `?raw` query: the MDX
  compiler strips the query before webpack sees it, so a query-based rule never matches. Sections:
  Overview, Design leg
  (imported), Behavior leg, **CQRS flow** (the Given/When/Then → panel mapping + diagram),
  Accessibility ([0004](0004-accessibility-conformance-model.md)), API (Controls), Scenarios. CSF
  `autodocs` is off; the MDX page supersedes it.
- **Taxonomy:** `Components/<Name>` with the MDX as the Docs page and named scenario stories
  (`Default`, `Disabled`, `Invalid`, `Touched`, …) — not `<Name>/GWT`.

## Considered options

- **Host component as the story subject** (the first implementation) — rejected: Controls/autodocs
  document the harness, not the component; duplicates Storybook's own state tracking; makes GWT feel
  like a separate, opaque story.
- **Storybook `componentWrapperDecorator`** — rejected: it cannot cleanly intercept the component's
  `output()` to derive and log the Command, which is the whole point of the When leg.
- **Render factory over the real component — chosen:** the only option where Controls/autodocs
  reflect the real component *and* the intent → Command flow is wired and visible.
- **Autodocs instead of MDX** — rejected: cannot lay out the four legs + CQRS flow + a11y as
  deliberate sections, so it fails the "complete context" goal.
- **Re-authoring the design leg in MDX** — rejected: drifts from `design.md`; importing it as a raw
  string keeps one source of truth.

## Consequences

- Stories read like normal component stories; the CQRS/ES wrapping is taught through panels a
  Storybook user already knows, plus one prose/diagram section in the Docs page.
- A single `gwtRender` factory (+ the existing `createGwtStoryWrapper`) is shared across components;
  per-component code is just the `when`/`then` mapping and the seeded Given.
- The MDX page and `design.md` cannot drift on the design leg, because one is imported into the
  other.
- This is the authoring convention for every future component, so the first few (starting with
  Select as the reference) are expected to iterate the factory and MDX template before it sets.
