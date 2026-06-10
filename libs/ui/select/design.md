# Select design contract

Select uses the global token vocabulary and owns design only.

## Anatomy

- `.ui-select`: vertical field layout using `--ui-space-2`.
- `.ui-select__label`: compact semibold label using the small typography tokens.
- `.ui-select__trigger`: full-width surface with border, medium radius, and horizontal spacing.
- `.ui-select__options`: elevated surface with border, medium radius, and `--ui-shadow-md`.
- `.ui-select__option`: semantic option row with compact spacing and small radius.

## States

- Focus-visible trigger uses `--ui-color-focus`.
- Active and selected options use `--ui-color-primary` with `--ui-color-on-primary`.
- Disabled trigger and options reduce opacity while retaining token-derived colors.
- Invalid and touched together emphasize the trigger border with `--ui-color-primary`.
