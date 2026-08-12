/**
 * @file Defines shared application configuration behavior for Config Schema.
 * It validates persisted settings and exposes a predictable store interface to the rest of the
 * application.
 */

import * as z from "zod";

import type {
  AppearancePreferences,
  ConfigState,
  ControlPreferences,
  StudyPreferences,
} from "@/shared/config/configTypes";

export const defaultConfig: ConfigState = Object.freeze({
  appearance: Object.freeze({
    darkMode: false,
    showHeader: true,
    fullscreen: false,
    sizeBackText: 0,
    hideBodyWhenCardChanged: true,
    showSwipeFeedback: false,
  }),
  study: Object.freeze({
    maxNumberOfCardsToLearn: 10,
    shuffled: false,
    useCardInterval: false,
    cardInterval: 60,
    keepBackTextViewed: false,
    defaultAutoPlay: false,
    selectedTags: Object.freeze([]) as unknown as string[],
  }),
  controls: Object.freeze({
    showSwipeButtonList: true,
    showScoreSlider: false,
    cardSwipeUp: "GoToNextCardMastered",
    cardSwipeDown: "GoToNextCardNotMastered",
    cardSwipeLeft: "GoToPrevCard",
    cardSwipeRight: "GoToNextCard",
  }),
});

const cardSwipeSchema = z.enum([
  "DoNothing",
  "GoBack",
  "GoToPrevCard",
  "GoToNextCard",
  "GoToNextCardMastered",
  "GoToNextCardNotMastered",
  "GoToNextCardToggleMastered",
]);

const appearanceSchema: z.ZodType<AppearancePreferences> = z
  .object({
    darkMode: z.boolean().catch(defaultConfig.appearance.darkMode),
    showHeader: z.boolean().catch(defaultConfig.appearance.showHeader),
    fullscreen: z.boolean().catch(defaultConfig.appearance.fullscreen),
    sizeBackText: z.number().min(0).catch(defaultConfig.appearance.sizeBackText),
    hideBodyWhenCardChanged: z.boolean().catch(defaultConfig.appearance.hideBodyWhenCardChanged),
    showSwipeFeedback: z.boolean().catch(defaultConfig.appearance.showSwipeFeedback),
  })
  .catch(defaultConfig.appearance);

const studySchema: z.ZodType<StudyPreferences> = z
  .object({
    maxNumberOfCardsToLearn: z.number().int().min(0).max(100).catch(defaultConfig.study.maxNumberOfCardsToLearn),
    shuffled: z.boolean().catch(defaultConfig.study.shuffled),
    useCardInterval: z.boolean().catch(defaultConfig.study.useCardInterval),
    cardInterval: z.number().min(0).max(60).catch(defaultConfig.study.cardInterval),
    keepBackTextViewed: z.boolean().catch(defaultConfig.study.keepBackTextViewed),
    defaultAutoPlay: z.boolean().catch(defaultConfig.study.defaultAutoPlay),
    selectedTags: z.array(z.string()).catch([...defaultConfig.study.selectedTags]),
  })
  .catch(defaultConfig.study);

const controlSchema: z.ZodType<ControlPreferences> = z
  .object({
    showSwipeButtonList: z.boolean().catch(defaultConfig.controls.showSwipeButtonList),
    showScoreSlider: z.boolean().catch(defaultConfig.controls.showScoreSlider),
    cardSwipeUp: cardSwipeSchema.catch(defaultConfig.controls.cardSwipeUp),
    cardSwipeDown: cardSwipeSchema.catch(defaultConfig.controls.cardSwipeDown),
    cardSwipeLeft: cardSwipeSchema.catch(defaultConfig.controls.cardSwipeLeft),
    cardSwipeRight: cardSwipeSchema.catch(defaultConfig.controls.cardSwipeRight),
  })
  .catch(defaultConfig.controls);

export const configSchema: z.ZodType<ConfigState> = z
  .object({
    appearance: appearanceSchema,
    study: studySchema,
    controls: controlSchema,
  })
  .catch(defaultConfig);

const getRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const normalizeAppearance = (appObj: Record<string, unknown>, obj: Record<string, unknown>) => ({
  darkMode: appObj.darkMode ?? obj.darkMode,
  showHeader: appObj.showHeader ?? obj.showHeader,
  fullscreen: appObj.fullscreen ?? obj.fullscreen,
  sizeBackText: appObj.sizeBackText ?? obj.sizeBackText,
  hideBodyWhenCardChanged: appObj.hideBodyWhenCardChanged ?? obj.hideBodyWhenCardChanged,
  showSwipeFeedback: appObj.showSwipeFeedback ?? obj.showSwipeFeedback,
});

const normalizeStudy = (studyObj: Record<string, unknown>, obj: Record<string, unknown>) => ({
  maxNumberOfCardsToLearn: studyObj.maxNumberOfCardsToLearn ?? obj.maxNumberOfCardsToLearn,
  shuffled: studyObj.shuffled ?? obj.shuffled,
  useCardInterval: studyObj.useCardInterval ?? obj.useCardInterval,
  cardInterval: studyObj.cardInterval ?? obj.cardInterval,
  keepBackTextViewed: studyObj.keepBackTextViewed ?? obj.keepBackTextViewed,
  defaultAutoPlay: studyObj.defaultAutoPlay ?? obj.defaultAutoPlay,
  selectedTags: studyObj.selectedTags ?? obj.selectedTags,
});

const normalizeControls = (ctrlObj: Record<string, unknown>, obj: Record<string, unknown>) => ({
  showSwipeButtonList: ctrlObj.showSwipeButtonList ?? obj.showSwipeButtonList,
  showScoreSlider: ctrlObj.showScoreSlider ?? obj.showScoreSlider,
  cardSwipeUp: ctrlObj.cardSwipeUp ?? obj.cardSwipeUp,
  cardSwipeDown: ctrlObj.cardSwipeDown ?? obj.cardSwipeDown,
  cardSwipeLeft: ctrlObj.cardSwipeLeft ?? obj.cardSwipeLeft,
  cardSwipeRight: ctrlObj.cardSwipeRight ?? obj.cardSwipeRight,
});

export const normalizeConfigInput = (input: unknown): unknown => {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const obj = input as Record<string, unknown>;

  return {
    appearance: normalizeAppearance(getRecord(obj.appearance), obj),
    study: normalizeStudy(getRecord(obj.study), obj),
    controls: normalizeControls(getRecord(obj.controls), obj),
  };
};

const persistedConfigStateSchema = z.object({ config: z.unknown() }).catch({ config: undefined });

/**
 * Parses persisted config into validated application data.
 * Malformed input is reported before downstream code relies on the result.
 */
export const parsePersistedConfig = (persistedState: unknown): ConfigState => {
  const parsed = persistedConfigStateSchema.parse(persistedState);
  const rawConfig = parsed.config !== undefined ? parsed.config : persistedState;
  return configSchema.parse(normalizeConfigInput(rawConfig));
};
