import type { z } from "zod";

import type {
  controlPreferencesSchema,
  languagePreferenceSchema,
  preferencesSchema,
  swipeActionSchema,
} from "./schema";

/** Control action assigned to a swipe direction. */
export type SwipeAction = z.infer<typeof swipeActionSchema>;
/** User-selected source for the application language. */
export type LanguagePreference = z.infer<typeof languagePreferenceSchema>;
/** Validated study control preferences. */
type ControlPreferences = z.infer<typeof controlPreferencesSchema>;
/** Complete validated user preferences. */
export type Preferences = z.infer<typeof preferencesSchema>;
/** Swipe-action fields keyed by their gesture direction. */
type SwipeState = Pick<ControlPreferences, "cardSwipeUp" | "cardSwipeDown" | "cardSwipeLeft" | "cardSwipeRight">;
/** Gesture direction that can be mapped to a study control action. */
export type SwipeDirection = keyof SwipeState;

/** Partial updates; omitted fields preserve their saved values. */
export type PartialPreferences = {
  /** Updates sample Deck loading. */
  loadSample?: Preferences["loadSample"];
  /** Updates the locale selection. */
  language?: Preferences["language"];
  /** Updates only the supplied visual settings. */
  appearance?: Partial<Preferences["appearance"]>;
  /** Updates only the supplied study settings. */
  study?: Partial<Preferences["study"]>;
  /** Updates only the supplied controls and gesture assignments. */
  controls?: Partial<Preferences["controls"]>;
};
