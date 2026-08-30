import type { LanguagePreference } from "@/entities/preference";

export type AppLanguage = "en" | "ja";

/** Resolves a persisted choice and the browser's primary locale to a supported application language. */
export const resolveEffectiveLanguage = (
  preference: LanguagePreference,
  browserLanguage: string | undefined
): AppLanguage => {
  if (preference !== "system") return preference;

  const primaryLanguage = browserLanguage?.trim().toLowerCase().split(/[-_]/, 1)[0];
  return primaryLanguage === "ja" ? "ja" : "en";
};
