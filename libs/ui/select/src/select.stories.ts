import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { type SelectReadModel, SelectGwtStory } from './select-story-wrapper';

const given: SelectReadModel = {
  options: [
    { label: 'Planned', value: 'planned' },
    { label: 'In progress', value: 'in-progress' },
    { label: 'Done', value: 'done' },
  ],
  selectedValue: 'planned',
};

const meta: Meta<SelectGwtStory> = {
  title: 'Select/GWT',
  component: SelectGwtStory,
  args: { given },
};

export default meta;
type Story = StoryObj<SelectGwtStory>;

async function expectSelection(
  canvasElement: HTMLElement,
  expectedValue: string,
): Promise<void> {
  const canvas = within(canvasElement);

  await expect(
    canvas.getByText('Last UI intent').nextElementSibling,
  ).toHaveTextContent(expectedValue);
  await expect(
    canvas.getByText('Last Command').nextElementSibling,
  ).toHaveTextContent('ChangeSelection');
  await expect(
    canvas.getByText('Rendered value').nextElementSibling,
  ).toHaveTextContent(expectedValue);
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });

    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    await expectSelection(canvasElement, 'in-progress');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });

    await userEvent.click(trigger);

    await expect(trigger).toBeDisabled();
    await expect(
      canvas.getByText('Last UI intent').nextElementSibling,
    ).toHaveTextContent('none');
    await expect(
      canvas.getByText('Rendered value').nextElementSibling,
    ).toHaveTextContent('planned');
  },
};

export const Invalid: Story = {
  args: { invalid: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });

    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(trigger);
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole('option', {
        name: 'Done',
      }),
    );

    await expectSelection(canvasElement, 'done');
  },
};

export const Touched: Story = {
  args: { touched: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Project status' });
    const field = trigger.closest('.ui-select');

    await expect(field).toHaveAttribute('data-touched', 'true');
    await userEvent.click(trigger);
    await userEvent.keyboard('d');

    await expectSelection(canvasElement, 'done');
  },
};
