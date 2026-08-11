/**
 * @file Defines shared defaults and option lists used across Tango.
 * Centralizing these values keeps forms, study behavior, and persistence code consistent.
 */

import type { Category } from "@/entities/deck";

export const LANGUAGES = [
  "c",
  "cpp",
  "kotlin",
  "python",
  "golang",
  "java",
  "javascript",
  "typescript",
  "haskell",
  "php",
  "ruby",
  "shell",
  "sh",
  "swift",
];

export const MAPPING = {
  hs: "haskell",
  go: "golang",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
} as const;

type MAPPINGKEY = keyof typeof MAPPING;

/**
 * Checks whether a language name is one of Tango's recognized shorthand aliases.
 * A successful check lets TypeScript safely use the value as a key in the language mapping table.
 */
export const CanMapping = (x: string): x is MAPPINGKEY => {
  return x in MAPPING;
};

export const CATEGORY: Category[] = ["raw", "markdown", "math"].concat(LANGUAGES);
