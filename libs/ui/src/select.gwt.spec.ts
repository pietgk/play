import {
  applySelection,
  changeSelection,
  type SelectReadModel,
} from '../select/src/select.gwt';

describe('Select GWT mapping', () => {
  it('maps a select UI intent to a ChangeSelection Command', () => {
    expect(changeSelection('done')).toEqual({
      type: 'ChangeSelection',
      selectedValue: 'done',
    });
  });

  it('projects the next read model from the Command', () => {
    const given: SelectReadModel = {
      options: [
        { label: 'Planned', value: 'planned' },
        { label: 'Done', value: 'done' },
      ],
      selectedValue: 'planned',
    };

    const next = applySelection(given, changeSelection('done'));

    expect(next.selectedValue).toBe('done');
    expect(next.options).toBe(given.options);
  });
});
