import type { z } from "zod";

import type { controlPreferencesSchema, preferencesSchema, swipeActionSchema } from "./schema";

/** Control action assigned to a swipe direction. */
export type SwipeAction = z.infer<typeof swipeActionSchema>;
/** Validated study control preferences. */
type ControlPreferences = z.infer<typeof controlPreferencesSchema>;
/** Complete validated user preferences. */
export type Preferences = z.infer<typeof preferencesSchema>;
/** Swipe-action fields keyed by their gesture direction. */
type SwipeState = Pick<ControlPreferences, "cardSwipeUp" | "cardSwipeDown" | "cardSwipeLeft" | "cardSwipeRight">;
/** Gesture direction that can be mapped to a study control action. */
export type SwipeDirection = keyof SwipeState;
