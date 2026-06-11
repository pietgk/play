export const WCAG_22_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21aa',
  'wcag22aa',
] as const;

export const WCAG_22_AA_RUN_ONLY = {
  type: 'tag' as const,
  values: [...WCAG_22_AA_TAGS],
};
