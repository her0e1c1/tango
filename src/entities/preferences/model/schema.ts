import * as z from "zod";

import { defaultPreferences } from "./preferences";
import type { AppearancePreferences, ControlPreferences, Preferences, StudyPreferences } from "./preferences";

const swipeActionSchema = z.enum([
  "DoNothing",
  "GoBack",
  "GoToPrevCard",
  "GoToNextCard",
  "GoToNextCardMastered",
  "GoToNextCardNotMastered",
  "GoToNextCardToggleMastered",
]);

const appearancePreferencesSchema: z.ZodType<AppearancePreferences> = z
  .object({
    darkMode: z.boolean().catch(defaultPreferences.appearance.darkMode),
    showHeader: z.boolean().catch(defaultPreferences.appearance.showHeader),
    fullscreen: z.boolean().catch(defaultPreferences.appearance.fullscreen),
    sizeBackText: z.number().min(0).catch(defaultPreferences.appearance.sizeBackText),
    hideBodyWhenCardChanged: z.boolean().catch(defaultPreferences.appearance.hideBodyWhenCardChanged),
    showSwipeFeedback: z.boolean().catch(defaultPreferences.appearance.showSwipeFeedback),
  })
  .catch(defaultPreferences.appearance);

const studyPreferencesSchema: z.ZodType<StudyPreferences> = z
  .object({
    maxNumberOfCardsToLearn: z.number().int().min(0).max(100).catch(defaultPreferences.study.maxNumberOfCardsToLearn),
    shuffled: z.boolean().catch(defaultPreferences.study.shuffled),
    useCardInterval: z.boolean().catch(defaultPreferences.study.useCardInterval),
    cardInterval: z.number().min(0).max(60).catch(defaultPreferences.study.cardInterval),
    keepBackTextViewed: z.boolean().catch(defaultPreferences.study.keepBackTextViewed),
    defaultAutoPlay: z.boolean().catch(defaultPreferences.study.defaultAutoPlay),
    selectedTags: z.array(z.string()).catch([...defaultPreferences.study.selectedTags]),
  })
  .catch(defaultPreferences.study);

const controlPreferencesSchema: z.ZodType<ControlPreferences> = z
  .object({
    showSwipeButtonList: z.boolean().catch(defaultPreferences.controls.showSwipeButtonList),
    showScoreSlider: z.boolean().catch(defaultPreferences.controls.showScoreSlider),
    cardSwipeUp: swipeActionSchema.catch(defaultPreferences.controls.cardSwipeUp),
    cardSwipeDown: swipeActionSchema.catch(defaultPreferences.controls.cardSwipeDown),
    cardSwipeLeft: swipeActionSchema.catch(defaultPreferences.controls.cardSwipeLeft),
    cardSwipeRight: swipeActionSchema.catch(defaultPreferences.controls.cardSwipeRight),
  })
  .catch(defaultPreferences.controls);

export const preferencesSchema: z.ZodType<Preferences> = z
  .object({
    appearance: appearancePreferencesSchema,
    study: studyPreferencesSchema,
    controls: controlPreferencesSchema,
  })
  .catch(defaultPreferences);
