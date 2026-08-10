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

const LANGUAGE_ALIASES = {
  hs: "haskell",
  go: "golang",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
} as const;

const isLanguageAlias = (value: string): value is keyof typeof LANGUAGE_ALIASES => value in LANGUAGE_ALIASES;

export const CATEGORIES = ["raw", "markdown", "math", ...LANGUAGES];

export const getContentCategory = (category: string, tags: string[]): string => {
  const recognized = tags
    .map((tag) => (isLanguageAlias(tag) ? LANGUAGE_ALIASES[tag] : tag))
    .filter((tag) => CATEGORIES.includes(tag));
  return recognized[0] ?? category;
};
