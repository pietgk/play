import { TestBed } from '@angular/core/testing';
import { Select } from '@play/ui/select';

describe('Select', () => {
  it('emits UI intent when a keyboard user selects an option', async () => {
    await TestBed.configureTestingModule({
      imports: [Select],
    }).compileComponents();

    const fixture = TestBed.createComponent(Select);
    const selected: string[] = [];

    fixture.componentRef.setInput('label', 'Project status');
    fixture.componentRef.setInput('options', [
      { label: 'Planned', value: 'planned' },
      { label: 'In progress', value: 'in-progress' },
      { label: 'Done', value: 'done' },
    ]);
    fixture.componentRef.setInput('value', 'planned');
    fixture.componentInstance.select.subscribe((value) => selected.push(value));
    fixture.detectChanges();
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector(
      '.ui-select__trigger',
    ) as HTMLElement;

    trigger.focus();
    fixture.detectChanges();
    await fixture.whenStable();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }),
    );
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(selected).toEqual(['in-progress']);
  });
});
