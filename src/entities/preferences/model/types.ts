import type { z } from "zod";

import type { controlPreferencesSchema, preferencesSchema, studyPreferencesSchema, swipeActionSchema } from "./schema";

export type SwipeAction = z.infer<typeof swipeActionSchema>;
export type StudyPreferences = z.infer<typeof studyPreferencesSchema>;
type ControlPreferences = z.infer<typeof controlPreferencesSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type SwipeState = Pick<ControlPreferences, "cardSwipeUp" | "cardSwipeDown" | "cardSwipeLeft" | "cardSwipeRight">;
export type SwipeDirection = keyof SwipeState;
