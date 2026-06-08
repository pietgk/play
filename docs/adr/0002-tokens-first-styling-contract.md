# Styling contract: design tokens (CSS custom properties), not Tailwind utilities in templates

**Status:** accepted

The Design System needs (1) clean separation of structure from design, (2) zero styling
coupling on consumers (it is a versioned dependency, not copy-paste — see
[0001](0001-design-system-distribution-and-layering.md)), and (3) a design surface an LLM /
`design.md` can drive consistently. spartan/shadcn bake Tailwind utility classes into
template markup; that welds design into structure, forces consumers to adopt a Tailwind
config, and gives an LLM unbounded utility strings to drift on.

## Decision

- The **public, themeable contract is design tokens as CSS custom properties**, shipped as
  `@play/ui/tokens` (e.g. `--ui-color-primary`, `--ui-radius-md`, `--ui-space-4`). Theming
  is done by overriding token values; no consumer build step required.
- **Component styles are authored in component-scoped CSS that consume tokens, using
  semantic class names** — structure (template) and design (CSS + tokens) stay separable.
- **Tailwind (v4, CSS-first `@theme`) is permitted only as an internal authoring tool** and
  must never appear in the public API. The library ships **compiled CSS**, not a Tailwind
  requirement.

## Consequences

- We lose the "paste a utility string" instant DX, in exchange for genuine
  structure/design separation, zero consumer coupling, and an LLM-tractable surface.
- `design.md` reasons over a **small semantic token vocabulary** (token names + which
  tokens a component uses), not arbitrary utility strings — this is what makes
  LLM-driven consistency tractable.
- Theming is global-override-friendly and survives extraction to npm unchanged.
