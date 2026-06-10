import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import {
  Combobox,
  ComboboxInput,
  ComboboxPopupContainer,
} from '@angular/aria/combobox';
import { Option } from '@angular/aria/listbox';
import { AriaSelectListboxGap } from './aria-select-listbox-gap';

let nextSelectId = 0;

interface AriaComboboxGap {
  close(): void;
  expanded(): boolean;
}

export interface SelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'lib-select',
  imports: [
    AriaSelectListboxGap,
    Combobox,
    ComboboxInput,
    ComboboxPopupContainer,
    Option,
  ],
  templateUrl: './select.html',
  styleUrl: './select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select {
  protected readonly triggerId = `lib-select-${nextSelectId++}`;
  private typeahead = '';
  private typeaheadReset: ReturnType<typeof setTimeout> | undefined;

  readonly options = input.required<readonly SelectOption[]>();
  readonly label = input('Select an option');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);

  readonly value = model<string | null>(null);
  readonly select = output<string>();

  protected readonly ariaValue = computed(() => {
    const value = this.value();
    return value === null ? [] : [value];
  });

  protected readonly displayValue = computed(
    () =>
      this.options().find((option) => option.value === this.value())?.label ??
      'Select an option',
  );

  protected commit(values: string[], combobox: AriaComboboxGap): void {
    const value = values[0];

    if (value !== undefined && value !== this.value()) {
      this.value.set(value);
      this.select.emit(value);
    }

    combobox.close();
  }

  protected handleTypeahead(
    event: KeyboardEvent,
    combobox: AriaComboboxGap,
  ): void {
    if (
      !combobox.expanded() ||
      event.key.length !== 1 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    this.typeahead += event.key.toLocaleLowerCase();
    clearTimeout(this.typeaheadReset);
    this.typeaheadReset = setTimeout(() => (this.typeahead = ''), 500);

    const match = this.options().find(
      (option) =>
        !option.disabled &&
        option.label.toLocaleLowerCase().startsWith(this.typeahead),
    );

    if (match && match.value !== this.value()) {
      event.preventDefault();
      this.value.set(match.value);
      this.select.emit(match.value);
      combobox.close();
    }
  }
}
