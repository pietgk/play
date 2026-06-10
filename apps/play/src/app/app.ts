import { Component, signal } from '@angular/core';
import { Select, type SelectOption } from '@play/ui/select';

interface ChangeStatusCommand {
  readonly type: 'change-status';
  readonly status: string;
}

@Component({
  selector: 'app-root',
  imports: [Select],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly statusOptions: readonly SelectOption[] = [
    { label: 'Planned', value: 'planned' },
    { label: 'In progress', value: 'in-progress' },
    { label: 'Done', value: 'done' },
  ];
  protected readonly status = signal<string | null>('planned');
  protected readonly lastCommand = signal<ChangeStatusCommand | null>(null);

  protected changeStatus(status: string): void {
    this.lastCommand.set({ type: 'change-status', status });
  }
}
