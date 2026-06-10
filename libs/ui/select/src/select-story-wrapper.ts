import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { createGwtStoryWrapper } from '../../.storybook/gwt-story-wrapper';
import { Select, type SelectOption } from './select';

export interface SelectReadModel {
  readonly options: readonly SelectOption[];
  readonly selectedValue: string | null;
}

export interface ChangeSelectionCommand {
  readonly type: 'ChangeSelection';
  readonly selectedValue: string;
}

@Component({
  selector: 'lib-select-gwt-story',
  imports: [Select],
  template: `
    <lib-select
      [disabled]="disabled()"
      [invalid]="invalid()"
      [label]="label()"
      [options]="readModel().options"
      [touched]="touched()"
      [value]="readModel().selectedValue"
      (select)="receive($event)"
    />

    <dl>
      <dt>Rendered value</dt>
      <dd>{{ readModel().selectedValue }}</dd>
      <dt>Last UI intent</dt>
      <dd>{{ lastIntent() ?? 'none' }}</dd>
      <dt>Last Command</dt>
      <dd>{{ lastCommand()?.type ?? 'none' }}</dd>
    </dl>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectGwtStory {
  readonly given = input.required<SelectReadModel>();
  readonly label = input('Project status');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);

  protected readonly readModel = linkedSignal(() => this.given());
  protected readonly lastIntent = signal<string | undefined>(undefined);
  protected readonly lastCommand = signal<ChangeSelectionCommand | undefined>(
    undefined,
  );

  protected receive(intent: string): void {
    const wrapper = createGwtStoryWrapper({
      given: this.readModel(),
      when: (selectedValue: string): ChangeSelectionCommand => ({
        type: 'ChangeSelection',
        selectedValue,
      }),
      then: (readModel, command) => ({
        ...readModel,
        selectedValue: command.selectedValue,
      }),
    });

    wrapper.receive(intent);

    this.lastIntent.set(wrapper.lastIntent());
    this.lastCommand.set(wrapper.lastCommand());
    this.readModel.set(wrapper.readModel());
  }
}
