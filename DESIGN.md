# Design Language

This document defines the shared design vocabulary for the Design System.
Components consume these tokens; applications theme them by overriding token
values.

## Principles

- Prefer a small, consistent vocabulary over one-off visual values.
- Keep structure, behavior, and design independent.
- Use semantic component classes that consume tokens.
- Treat CSS custom properties as the public theming contract.
- Preserve usable contrast, focus visibility, and target size in every theme.

## Token Vocabulary

| Category   | Tokens                                                                                                                                                      | Purpose                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Color      | `--ui-color-primary`, `--ui-color-on-primary`, `--ui-color-text`, `--ui-color-surface`, `--ui-color-surface-muted`, `--ui-color-border`, `--ui-color-focus` | Semantic foregrounds, backgrounds, borders, and focus indicators |
| Radius     | `--ui-radius-sm`, `--ui-radius-md`, `--ui-radius-lg`                                                                                                        | Consistent corner treatments                                     |
| Spacing    | `--ui-space-1`, `--ui-space-2`, `--ui-space-4`, `--ui-space-6`, `--ui-space-8`                                                                              | Layout gaps, padding, and margins                                |
| Typography | `--ui-font-family-sans`, `--ui-font-size-*`, `--ui-font-weight-*`, `--ui-line-height-*`                                                                     | Readable type hierarchy                                          |
| Elevation  | `--ui-shadow-md`                                                                                                                                            | Reserved semantic elevation                                      |

## Accessibility Baseline

The conformance core is WCAG 2.2 Level AA. Components must preserve semantic
HTML, keyboard operation, visible focus, sufficient contrast, readable text,
and reduced-motion preferences. Automated checks are necessary but do not
replace the manual conformance checklist.

Themes must keep `--ui-color-primary` and `--ui-color-on-primary` at sufficient
contrast, and `--ui-color-focus` visible against adjacent surfaces.

## Naming Conventions

- Public custom properties start with `--ui-`.
- Name tokens by semantic role, not a literal color or implementation detail.
- Use category-first names: `--ui-color-*`, `--ui-radius-*`, `--ui-space-*`,
  `--ui-font-*`, and `--ui-line-height-*`.
- Use the spacing scale suffix as a relative step, not a pixel measurement.
- Component-specific tokens, when needed, use `--ui-<component>-<role>`.
