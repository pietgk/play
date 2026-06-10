export interface StoryWrapper<TIntent> {
  receive(intent: TIntent): void;
}

export interface GwtStoryWrapper<TReadModel, TIntent, TCommand>
  extends StoryWrapper<TIntent> {
  readonly readModel: () => TReadModel;
  readonly lastIntent: () => TIntent | undefined;
  readonly lastCommand: () => TCommand | undefined;
}

export function createGwtStoryWrapper<TReadModel, TIntent, TCommand>({
  given,
  when,
  then,
}: {
  readonly given: TReadModel;
  readonly when: (intent: TIntent) => TCommand;
  readonly then: (readModel: TReadModel, command: TCommand) => TReadModel;
}): GwtStoryWrapper<TReadModel, TIntent, TCommand> {
  let readModel = given;
  let lastIntent: TIntent | undefined;
  let lastCommand: TCommand | undefined;

  return {
    readModel: () => readModel,
    lastIntent: () => lastIntent,
    lastCommand: () => lastCommand,
    receive: (intent) => {
      const command = when(intent);

      lastIntent = intent;
      lastCommand = command;
      readModel = then(readModel, command);
    },
  };
}
