import * as z from "zod";

const DEFAULT_APPEARANCE = {
  darkMode: false,
  showHeader: true,
  fullscreen: false,
  sizeBackText: 0,
  hideBodyWhenCardChanged: true,
  showSwipeFeedback: false,
};

const DEFAULT_STUDY = {
  maxNumberOfCardsToLearn: 10,
  shuffled: false,
  useCardInterval: false,
  cardInterval: 60,
  keepBackTextViewed: false,
  defaultAutoPlay: false,
  selectedTags: [] as string[],
};

const DEFAULT_CONTROLS = {
  showSwipeButtonList: true,
  showScoreSlider: false,
  cardSwipeUp: "GoToNextCardMastered" as const,
  cardSwipeDown: "GoToNextCardNotMastered" as const,
  cardSwipeLeft: "GoToPrevCard" as const,
  cardSwipeRight: "GoToNextCard" as const,
};

export const swipeActionSchema = z.enum([
  "DoNothing",
  "GoBack",
  "GoToPrevCard",
  "GoToNextCard",
  "GoToNextCardMastered",
  "GoToNextCardNotMastered",
  "GoToNextCardToggleMastered",
]);

const appearancePreferencesSchema = z
  .object({
    darkMode: z.boolean().catch(DEFAULT_APPEARANCE.darkMode),
    showHeader: z.boolean().catch(DEFAULT_APPEARANCE.showHeader),
    fullscreen: z.boolean().catch(DEFAULT_APPEARANCE.fullscreen),
    sizeBackText: z.number().min(0).catch(DEFAULT_APPEARANCE.sizeBackText),
    hideBodyWhenCardChanged: z.boolean().catch(DEFAULT_APPEARANCE.hideBodyWhenCardChanged),
    showSwipeFeedback: z.boolean().catch(DEFAULT_APPEARANCE.showSwipeFeedback),
  })
  .catch(DEFAULT_APPEARANCE);

export const studyPreferencesSchema = z
  .object({
    maxNumberOfCardsToLearn: z.number().int().min(0).max(100).catch(DEFAULT_STUDY.maxNumberOfCardsToLearn),
    shuffled: z.boolean().catch(DEFAULT_STUDY.shuffled),
    useCardInterval: z.boolean().catch(DEFAULT_STUDY.useCardInterval),
    cardInterval: z.number().min(0).max(60).catch(DEFAULT_STUDY.cardInterval),
    keepBackTextViewed: z.boolean().catch(DEFAULT_STUDY.keepBackTextViewed),
    defaultAutoPlay: z.boolean().catch(DEFAULT_STUDY.defaultAutoPlay),
    selectedTags: z.array(z.string()).catch([...DEFAULT_STUDY.selectedTags]),
  })
  .catch(DEFAULT_STUDY);

export const controlPreferencesSchema = z
  .object({
    showSwipeButtonList: z.boolean().catch(DEFAULT_CONTROLS.showSwipeButtonList),
    showScoreSlider: z.boolean().catch(DEFAULT_CONTROLS.showScoreSlider),
    cardSwipeUp: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeUp),
    cardSwipeDown: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeDown),
    cardSwipeLeft: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeLeft),
    cardSwipeRight: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeRight),
  })
  .catch(DEFAULT_CONTROLS);

export const preferencesSchema = z
  .object({
    appearance: appearancePreferencesSchema,
    study: studyPreferencesSchema,
    controls: controlPreferencesSchema,
  })
  .catch({
    appearance: DEFAULT_APPEARANCE,
    study: DEFAULT_STUDY,
    controls: DEFAULT_CONTROLS,
  });
