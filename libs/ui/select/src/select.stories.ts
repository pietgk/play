import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { gwtRender } from '../../.storybook/gwt-render';
import { Select, type SelectOption } from './select';
import { changeSelection } from './select.gwt';

const options: readonly SelectOption[] = [
  { label: 'Planned', value: 'planned' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
];

/** Story args = the component inputs (the Given), as plain values. */
interface SelectArgs {
  options: readonly SelectOption[];
  label: string;
  disabled: boolean;
  invalid: boolean;
  touched: boolean;
  value: string | null;
}

// The GWT wrapper's When: binds the `select` UI intent, logs intent + derived
// Command to Actions, and exposes a spy for scenario plays (ADR 0009).
const gwt = gwtRender<string, ReturnType<typeof changeSelection>>({
  intentOutput: 'select',
  when: changeSelection,
});

const meta: Meta<SelectArgs> = {
  title: 'Components/Select',
  component: Select,
  // No `autodocs` tag — `select.mdx` is the attached Docs page (ADR 0009).
  render: gwt.render,
  beforeEach: () => gwt.reset(),
  args: {
    options,
    label: 'Project status',
    value: 'planned',
    disabled: false,
    invalid: false,
    touched: false,
  },
};

export default meta;
type Story = StoryObj<SelectArgs>;

// ─── Showcase stories ────────────────────────────────────────────────────────
// One per `design.md` state. Autodocs + axe gate (ADR 0003/0004). No play.

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const Invalid: Story = { args: { invalid: true } };

export const Touched: Story = { args: { touched: true } };

// ─── Scenario stories ────────────────────────────────────────────────────────
// One per interaction path. Excluded from docs, run in the test-runner (ADR 0010).
// Assert only browser-only concerns: the intent fired (spy) + the rendered Then
// (canvas). The derived Command is panel-visible but owned/asserted by the
// pure-logic layer (select.gwt.spec.ts).

const scenario = ['test', '!autodocs', '!dev'];

export const KeyboardSelect: Story = {
  tags: scenario,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });

    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    await expect(trigger).toHaveValue('In progress');
    await expect(gwt.spy).toHaveBeenCalledWith('in-progress');
  },
};

export const MouseSelect: Story = {
  tags: scenario,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });

    await userEvent.click(trigger);
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole('option', {
        name: 'Done',
      }),
    );

    await expect(trigger).toHaveValue('Done');
    await expect(gwt.spy).toHaveBeenCalledWith('done');
  },
};

export const TypeaheadSelect: Story = {
  tags: scenario,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });

    await userEvent.click(trigger);
    await userEvent.keyboard('d');

    await expect(trigger).toHaveValue('Done');
    await expect(gwt.spy).toHaveBeenCalledWith('done');
  },
};

export const DisabledBlocksInteraction: Story = {
  tags: scenario,
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });

    await userEvent.click(trigger);

    await expect(trigger).toBeDisabled();
    await expect(gwt.spy).not.toHaveBeenCalled();
    await expect(trigger).toHaveValue('Planned');
  },
};
