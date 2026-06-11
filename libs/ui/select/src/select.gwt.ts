import type { SelectOption } from './select';

/**
 * The consumer-side CQRS mapping for Select, demonstrated by the stories. This is
 * *not* part of the library's public API — components speak generic UI intent
 * (ADR 0005); the Command/read-model vocabulary lives in the consumer (here, the
 * story wrapper). Kept pure so the pure-logic test layer owns it
 * (ADR 0010), and reused by `gwtRender` to surface the flow in the Actions panel.
 */

export interface ChangeSelectionCommand {
  readonly type: 'ChangeSelection';
  readonly selectedValue: string;
}

export interface SelectReadModel {
  readonly options: readonly SelectOption[];
  readonly selectedValue: string | null;
}

/** When: a `select` UI intent becomes a `ChangeSelection` Command. */
export function changeSelection(intent: string): ChangeSelectionCommand {
  return { type: 'ChangeSelection', selectedValue: intent };
}

/** Then: project the next read model from the Command. */
export function applySelection(
  readModel: SelectReadModel,
  command: ChangeSelectionCommand,
): SelectReadModel {
  return { ...readModel, selectedValue: command.selectedValue };
}
