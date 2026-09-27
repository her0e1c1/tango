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
  viewMode: false,
  showViewMode: true,
  showHelp: true,
  showEditLink: true,
  showSwipeButtonList: true,
  showPlaybackControls: true,
  showCardDetails: true,
  showBackTextSwipeOverlays: false,
  showSkip: true,
  cardSwipeUp: "RateEasy" as const,
  cardSwipeDown: "RateHard" as const,
  cardSwipeLeft: "RateAgain" as const,
  cardSwipeRight: "RateGood" as const,
};

const DEFAULT_LOAD_SAMPLE = true;
const DEFAULT_LANGUAGE = "system" as const;

const languagePreferenceSchema = z.enum(["system", "en", "ja"]);

const swipeActionSchema = z.enum([
  "DoNothing",
  "GoBack",
  "GoToNextCard",
  "RateGood",
  "RateAgain",
  "RateHard",
  "RateEasy",
]);

const appearancePreferencesSchema = z
  .object({
    /** Whether the dark color theme is enabled. */
    darkMode: z.boolean().catch(DEFAULT_APPEARANCE.darkMode),
    /** Retained fullscreen preference; currently unused by the UI. */
    fullscreen: z.boolean().catch(DEFAULT_APPEARANCE.fullscreen),
    /** Retained non-negative answer text size preference; currently unused by the UI. */
    sizeBackText: z.number().min(0).catch(DEFAULT_APPEARANCE.sizeBackText),
    /** Whether changing Cards hides the answer. */
    hideBodyWhenCardChanged: z.boolean().catch(DEFAULT_APPEARANCE.hideBodyWhenCardChanged),
    /** Whether swipe action feedback is displayed. */
    showSwipeFeedback: z.boolean().catch(DEFAULT_APPEARANCE.showSwipeFeedback),
  })
  .catch(DEFAULT_APPEARANCE);

const studyPreferencesSchema = z
  .object({
    /** Study selection limit from 0 through 100 Cards; zero means no limit. */
    maxNumberOfCardsToLearn: z
      .number()
      .int()
      .min(studyPreferencesLimits.maxNumberOfCardsToLearn.min)
      .max(studyPreferencesLimits.maxNumberOfCardsToLearn.max)
      .catch(DEFAULT_STUDY.maxNumberOfCardsToLearn),
    /** Whether the selected Card order is shuffled. */
    shuffled: z.boolean().catch(DEFAULT_STUDY.shuffled),
    /** Whether study selection respects FSRS due dates, excluding future Cards and prioritizing due Cards. */
    useCardInterval: z.boolean().catch(DEFAULT_STUDY.useCardInterval),
    /** Automatic playback interval from 0 through 60 seconds; zero disables the timer. */
    cardInterval: z
      .number()
      .min(studyPreferencesLimits.cardInterval.min)
      .max(studyPreferencesLimits.cardInterval.max)
      .catch(DEFAULT_STUDY.cardInterval),
    /** Retained answer visibility preference; currently unused by playback. */
    keepBackTextViewed: z.boolean().catch(DEFAULT_STUDY.keepBackTextViewed),
    /** Whether automatic playback starts enabled. */
    defaultAutoPlay: z.boolean().catch(DEFAULT_STUDY.defaultAutoPlay),
    /** Retained global tag preference; current study selection uses Deck tags. */
    selectedTags: z.array(z.string()).catch([...DEFAULT_STUDY.selectedTags]),
  })
  .catch(DEFAULT_STUDY);

const controlPreferencesSchema = z
  .object({
    /** Whether the study view mode is active. */
    viewMode: z.boolean().catch(DEFAULT_CONTROLS.viewMode),
    /** Whether the view-mode control is visible. */
    showViewMode: z.boolean().catch(DEFAULT_CONTROLS.showViewMode),
    /** Whether the help control is visible. */
    showHelp: z.boolean().catch(DEFAULT_CONTROLS.showHelp),
    /** Whether the Card edit link is visible. */
    showEditLink: z.boolean().catch(DEFAULT_CONTROLS.showEditLink),
    /** Whether swipe action buttons are visible. */
    showSwipeButtonList: z.boolean().catch(DEFAULT_CONTROLS.showSwipeButtonList),
    /** Whether playback controls are visible. */
    showPlaybackControls: z.boolean().catch(DEFAULT_CONTROLS.showPlaybackControls),
    /** Whether Card details are visible. */
    showCardDetails: z.boolean().catch(DEFAULT_CONTROLS.showCardDetails),
    /** Whether swipe overlays appear on the answer. */
    showBackTextSwipeOverlays: z.boolean().catch(DEFAULT_CONTROLS.showBackTextSwipeOverlays),
    /** Whether the skip control is visible. */
    showSkip: z.boolean().catch(DEFAULT_CONTROLS.showSkip),
    /** Action triggered by an upward Card swipe. */
    cardSwipeUp: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeUp),
    /** Action triggered by a downward Card swipe. */
    cardSwipeDown: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeDown),
    /** Action triggered by a leftward Card swipe. */
    cardSwipeLeft: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeLeft),
    /** Action triggered by a rightward Card swipe. */
    cardSwipeRight: swipeActionSchema.catch(DEFAULT_CONTROLS.cardSwipeRight),
  })
  .catch(DEFAULT_CONTROLS);

export const preferencesSchema = z
  .object({
    /** Whether sample Deck bootstrap is pending; cleared after the sample Deck is loaded. */
    loadSample: z.boolean().catch(DEFAULT_LOAD_SAMPLE),
    // Language is additive within persistence version 1, so recover it without discarding the rest of the snapshot.
    /** Locale override; system follows the browser language. */
    language: languagePreferenceSchema.catch(DEFAULT_LANGUAGE),
    /** Visual presentation settings. */
    appearance: appearancePreferencesSchema,
    /** Card selection and automatic playback settings. */
    study: studyPreferencesSchema,
    /** Study controls and swipe gesture assignments. */
    controls: controlPreferencesSchema,
  })
  .catch({
    loadSample: DEFAULT_LOAD_SAMPLE,
    language: DEFAULT_LANGUAGE,
    appearance: DEFAULT_APPEARANCE,
    study: DEFAULT_STUDY,
    controls: DEFAULT_CONTROLS,
  });

// Recognize the complete former default before removed actions fall back individually.
const legacyDefaultPreferencesSchema = z.looseObject({
  controls: z.looseObject({
    cardSwipeUp: z.literal("GoToNextCardMastered"),
    cardSwipeDown: z.literal("GoToNextCardNotMastered"),
    cardSwipeLeft: z.literal("GoToPrevCard"),
    cardSwipeRight: z.literal("GoToNextCard"),
  }),
});

export const persistedPreferencesSchema = z.preprocess((value) => {
  const legacy = legacyDefaultPreferencesSchema.safeParse(value);
  if (!legacy.success) return value;
  return {
    ...legacy.data,
    controls: {
      ...legacy.data.controls,
      cardSwipeUp: DEFAULT_CONTROLS.cardSwipeUp,
      cardSwipeDown: DEFAULT_CONTROLS.cardSwipeDown,
      cardSwipeLeft: DEFAULT_CONTROLS.cardSwipeLeft,
      cardSwipeRight: DEFAULT_CONTROLS.cardSwipeRight,
    },
  };
}, preferencesSchema);
