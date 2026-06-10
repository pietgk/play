import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Select } from '@play/ui/select';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('renders the themed Select and maps UI intent to a Command', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const playground = compiled.querySelector('.playground');

    expect(compiled.querySelector('lib-select')).not.toBeNull();
    expect(
      getComputedStyle(playground as Element)
        .getPropertyValue('--ui-color-primary')
        .trim(),
    ).toBe('#6d28d9');

    const select = fixture.debugElement.query(By.directive(Select))
      .componentInstance as Select;

    select.select.emit('done');
    fixture.detectChanges();

    expect(compiled.querySelector('.command-output')?.textContent).toContain(
      'Command: change-status / done',
    );
  });
});
