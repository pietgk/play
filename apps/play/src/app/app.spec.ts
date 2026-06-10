import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('renders a Playground swatch themed by the token contract', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const playground = compiled.querySelector('.playground');

    expect(compiled.querySelector('.token-swatch')?.textContent).toContain(
      '--ui-color-primary',
    );
    expect(
      getComputedStyle(playground as Element)
        .getPropertyValue('--ui-color-primary')
        .trim(),
    ).toBe('#6d28d9');
  });
});
