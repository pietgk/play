const { getJestConfig } = require('@storybook/test-runner');

const config = getJestConfig();

module.exports = {
  ...config,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
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
