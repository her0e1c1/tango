// Keep domain validation and editing controls aligned on the same preference limits.
export const studyPreferencesLimits = {
  maxNumberOfCardsToLearn: {
    min: 0,
    max: 100,
  },
  cardInterval: {
    min: 0,
    max: 60,
  },
} as const;
