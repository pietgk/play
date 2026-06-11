import type { Preview } from '@storybook/angular';
import { WCAG_22_AA_RUN_ONLY } from './a11y';

const preview: Preview = {
  parameters: {
    a11y: {
      test: 'error',
      options: {
        runOnly: WCAG_22_AA_RUN_ONLY,
      },
    },
  },
};

export default preview;
