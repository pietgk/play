import { UI_TOKEN_NAMES } from '../tokens/src/token-names';

describe('UI token contract', () => {
  it.each(['color', 'radius', 'space', 'font'])(
    'publishes %s tokens',
    (category) => {
      expect(
        UI_TOKEN_NAMES.some((token) => token.startsWith(`--ui-${category}`)),
      ).toBe(true);
    },
  );

  it('uses the public --ui- namespace', () => {
    expect(UI_TOKEN_NAMES.every((token) => token.startsWith('--ui-'))).toBe(
      true,
    );
  });
});
