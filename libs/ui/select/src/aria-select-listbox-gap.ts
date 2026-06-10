import { Listbox } from '@angular/aria/listbox';
import { Directive } from '@angular/core';

@Directive({
  selector: '[libAriaSelectListbox]',
  hostDirectives: [
    {
      directive: Listbox,
      inputs: [
        'values: value',
        'disabled',
        'readonly',
        'selectionMode',
        'typeaheadDelay',
        'wrap',
      ],
      outputs: ['valuesChange: valueChange'],
    },
  ],
})
export class AriaSelectListboxGap {}
