import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  // Lets the MDX docs page import a component's `design.md` as a raw string so
  // the design leg keeps a single source of truth (ADR 0009). `.md` is matched by
  // path (the MDX loader only claims `.mdx`), avoiding query-stripping by the MDX
  // compiler.
  webpackFinal: async (webpackConfig) => {
    webpackConfig.module ??= {};
    webpackConfig.module.rules ??= [];
    webpackConfig.module.rules.unshift({
      test: /\.md$/,
      type: 'asset/source',
    });
    return webpackConfig;
  },
};

export default config;
