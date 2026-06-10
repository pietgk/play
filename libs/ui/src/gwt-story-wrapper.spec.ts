import { createGwtStoryWrapper } from '../.storybook/gwt-story-wrapper';

describe('GWT story wrapper', () => {
  it('maps public UI intent to a command and projects the next read model', () => {
    const wrapper = createGwtStoryWrapper({
      given: { selectedValue: 'planned' },
      when: (selectedValue: string) => ({
        type: 'ChangeProjectStatus' as const,
        selectedValue,
      }),
      then: (_readModel, command) => ({
        selectedValue: command.selectedValue,
      }),
    });

    wrapper.receive('done');

    expect(wrapper.lastIntent()).toBe('done');
    expect(wrapper.lastCommand()).toEqual({
      type: 'ChangeProjectStatus',
      selectedValue: 'done',
    });
    expect(wrapper.readModel()).toEqual({ selectedValue: 'done' });
  });
});
