import type { TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, injectAxe } from 'axe-playwright';
import { WCAG_22_AA_RUN_ONLY } from './a11y.ts';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, 'body', {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: { runOnly: WCAG_22_AA_RUN_ONLY },
    });
  },
};

export default config;
