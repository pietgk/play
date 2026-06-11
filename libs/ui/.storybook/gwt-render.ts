import { action } from 'storybook/actions';
import { fn } from 'storybook/test';

export interface GwtRenderOptions<TIntent, TCommand extends { type: string }> {
  /** The name of the component's UI-intent `output()` (e.g. `'select'`). */
  readonly intentOutput: string;
  /**
   * When: map a generic UI intent to the consumer's domain Command. Pure, and
   * owned/asserted by the pure-logic test layer — here it only feeds the Actions
   * panel so the CQRS flow is visible (ADR 0009).
   */
  readonly when: (intent: TIntent) => TCommand;
}

export interface GwtRender<TIntent> {
  /** Use as `meta.render`. Binds the real component (the story subject) to the args. */
  readonly render: (args: Record<string, unknown>) => { props: object };
  /** The intent spy, for scenario plays to assert the When fired. */
  readonly spy: ReturnType<typeof fn<(intent: TIntent) => void>>;
  /** Use as `meta.beforeEach` to isolate the spy between stories. */
  readonly reset: () => void;
}

/**
 * Expresses the GWT story wrapper as a thin render layer over the *real* component
 * (ADR 0009). The story subject stays the component (`meta.component`), so
 * Controls/autodocs reflect its real API, while the CQRS flow is shown via native
 * panels:
 *
 * - **Given** → the story `args` (Controls), bound to the component as inputs.
 * - **When** → the UI-intent `output()` is bound (by name, via `props`) to a spy
 *   whose implementation logs the intent and the derived Command to the **Actions**
 *   panel. The spy is exposed so scenario plays can assert it.
 * - **Then** → handled natively by the component's `model()` two-way binding, which
 *   re-renders the canvas and updates the value Control.
 *
 * The spy is owned here (closure) rather than passed through args, because
 * `@storybook/angular` does not deliver function-valued args to a `render`. Wire
 * `reset` into `meta.beforeEach` so each story starts with a clean spy.
 */
export function gwtRender<TIntent, TCommand extends { type: string }>({
  intentOutput,
  when,
}: GwtRenderOptions<TIntent, TCommand>): GwtRender<TIntent> {
  const logIntent = action('UI intent');
  const spy = fn((intent: TIntent): void => {
    logIntent(intent);
    const command = when(intent);
    action(`Command: ${command.type}`)(command);
  });

  return {
    spy,
    reset: () => spy.mockClear(),
    render: (args) => ({ props: { ...args, [intentOutput]: spy } }),
  };
}
