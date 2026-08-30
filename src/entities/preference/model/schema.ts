import * as z from "zod";

import { studyPreferencesLimits } from "./rules";

// Current-version runtime input recovers malformed fields; breaking persisted shapes are rejected by store versioning.
const DEFAULT_APPEARANCE = {
  darkMode: false,
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
  showPlaybackControls: true,
  showCardDetails: true,
  showScoreSlider: false,
  showBackTextSwipeOverlays: false,
  cardSwipeUp: "GoToNextCardMastered" as const,
  cardSwipeDown: "GoToNextCardNotMastered" as const,
  cardSwipeLeft: "GoToPrevCard" as const,
  cardSwipeRight: "GoToNextCard" as const,
};

const DEFAULT_LOAD_SAMPLE = true;

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
    fullscreen: z.boolean().catch(DEFAULT_APPEARANCE.fullscreen),
    sizeBackText: z.number().min(0).catch(DEFAULT_APPEARANCE.sizeBackText),
    hideBodyWhenCardChanged: z.boolean().catch(DEFAULT_APPEARANCE.hideBodyWhenCardChanged),
    showSwipeFeedback: z.boolean().catch(DEFAULT_APPEARANCE.showSwipeFeedback),
  })
  .catch(DEFAULT_APPEARANCE);

const studyPreferencesSchema = z
  .object({
    maxNumberOfCardsToLearn: z
      .number()
      .int()
      .min(studyPreferencesLimits.maxNumberOfCardsToLearn.min)
      .max(studyPreferencesLimits.maxNumberOfCardsToLearn.max)
      .catch(DEFAULT_STUDY.maxNumberOfCardsToLearn),
    shuffled: z.boolean().catch(DEFAULT_STUDY.shuffled),
    useCardInterval: z.boolean().catch(DEFAULT_STUDY.useCardInterval),
    cardInterval: z
      .number()
      .min(studyPreferencesLimits.cardInterval.min)
      .max(studyPreferencesLimits.cardInterval.max)
      .catch(DEFAULT_STUDY.cardInterval),
    keepBackTextViewed: z.boolean().catch(DEFAULT_STUDY.keepBackTextViewed),
    defaultAutoPlay: z.boolean().catch(DEFAULT_STUDY.defaultAutoPlay),
    selectedTags: z.array(z.string()).catch([...DEFAULT_STUDY.selectedTags]),
  })
  .catch(DEFAULT_STUDY);

export const controlPreferencesSchema = z
  .object({
    showSwipeButtonList: z.boolean().catch(DEFAULT_CONTROLS.showSwipeButtonList),
    showPlaybackControls: z.boolean().catch(DEFAULT_CONTROLS.showPlaybackControls),
    showCardDetails: z.boolean().catch(DEFAULT_CONTROLS.showCardDetails),
    showScoreSlider: z.boolean().catch(DEFAULT_CONTROLS.showScoreSlider),
    showBackTextSwipeOverlays: z.boolean().catch(DEFAULT_CONTROLS.showBackTextSwipeOverlays),
    cardSwipeUp: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeUp),
    cardSwipeDown: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeDown),
    cardSwipeLeft: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeLeft),
    cardSwipeRight: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeRight),
  })
  .catch(DEFAULT_CONTROLS);

export const preferencesSchema = z
  .object({
    loadSample: z.boolean().catch(DEFAULT_LOAD_SAMPLE),
    appearance: appearancePreferencesSchema,
    study: studyPreferencesSchema,
    controls: controlPreferencesSchema,
  })
  .catch({
    loadSample: DEFAULT_LOAD_SAMPLE,
    appearance: DEFAULT_APPEARANCE,
    study: DEFAULT_STUDY,
    controls: DEFAULT_CONTROLS,
  });
