/**
 * @file Defines shared defaults and option lists used across Tango.
 * Centralizing these values keeps forms, study behavior, and persistence code consistent.
 */

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

export const CSV_SAMPLE_TEXT = `\
"Write a question in front text","Write the answer for it in back text","","question-answer-example"
"hello word in python","print('hello world')","python","hello-world-python"
"What is the area of a circle with a radius of r?","$\\pi r^2$","math","circle-area"`;
