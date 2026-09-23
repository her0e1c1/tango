import en from "./locales/en.json";
import ja from "./locales/ja.json";

/** Static application copy bundled for every supported language. */
export const resources = {
  en: { translation: en },
  ja: { translation: ja },
} as const;

// Recovery copy must not depend on persisted application state.
export type RecoveryMessages =
  | typeof resources.en.translation.errorBoundary
  | typeof resources.ja.translation.errorBoundary;

export function getRecoveryMessages(language: string = navigator.language): RecoveryMessages {
  return language.startsWith("ja") ? resources.ja.translation.errorBoundary : resources.en.translation.errorBoundary;
}
