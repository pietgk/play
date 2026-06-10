const { getJestConfig } = require('@storybook/test-runner');

const config = getJestConfig();

module.exports = {
  ...config,
  testEnvironmentOptions: {
    'jest-playwright': {
      ...config.testEnvironmentOptions['jest-playwright'],
      launchOptions: {
        chromium: {
          channel: 'chromium',
        },
      },
    },
  },
};
