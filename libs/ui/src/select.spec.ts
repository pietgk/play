import { TestBed } from '@angular/core/testing';
import { Select } from '@play/ui/select';

describe('Select', () => {
  it('renders touched control state', async () => {
    await TestBed.configureTestingModule({
      imports: [Select],
    }).compileComponents();

    const fixture = TestBed.createComponent(Select);

    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('touched', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const field = fixture.nativeElement.querySelector(
      '.ui-select',
    ) as HTMLElement;

    expect(field.getAttribute('data-touched')).toBe('true');
  });

  it('exposes its current value, expanded state, and options to assistive technology', async () => {
    await TestBed.configureTestingModule({
      imports: [Select],
    }).compileComponents();

    const fixture = TestBed.createComponent(Select);

    fixture.componentRef.setInput('label', 'Project status');
    fixture.componentRef.setInput('options', [
      { label: 'Planned', value: 'planned' },
      { label: 'In progress', value: 'in-progress' },
      { label: 'Done', value: 'done' },
    ]);
    fixture.componentRef.setInput('value', 'planned');
    fixture.detectChanges();
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector(
      '.ui-select__trigger',
    ) as HTMLInputElement;

    expect(trigger.getAttribute('role')).toBe('combobox');
    expect(trigger.value).toBe('Planned');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.focus();
    fixture.detectChanges();
    await fixture.whenStable();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const listbox = fixture.nativeElement.ownerDocument.body.querySelector(
      '[role="listbox"]',
    ) as HTMLElement | null;
    const options = Array.from(
      listbox?.querySelectorAll('[role="option"]') ?? [],
    ) as HTMLElement[];

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(listbox).not.toBeNull();
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'Planned',
      'In progress',
      'Done',
    ]);
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');
  });

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
