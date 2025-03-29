export const SWIPE_GESTURES = {
  cardSwipeUp: "↑",
  cardSwipeDown: "↓",
  cardSwipeLeft: "←",
  cardSwipeRight: "→",
} as const;

export const SWIPE_DIRECTIONS = ["cardSwipeLeft", "cardSwipeDown", "cardSwipeUp", "cardSwipeRight"] as SwipeDirection[];

export const NEXT_SEEING_MINUTES = {
  0: "soon",
  60: "1 hour later",
  [60 * 4]: "4 hours later",
  [60 * 8]: "8 hours later",
  [60 * 24]: "1 day later",
  [60 * 24 * 2]: "2 days later",
  [60 * 24 * 3]: "3 days later",
  [60 * 24 * 7]: "1 week later",
  [60 * 24 * 7 * 2]: "2 weeks later",
  [60 * 24 * 30]: "1 month later",
  [60 * 24 * 30 * 2]: "2 months later",
  [60 * 24 * 30 * 6]: "6 months later",
  [60 * 24 * 365]: "1 year later",
} as const;

export const NEXT_SEEING_MINUTES_KEYS = Object.keys(NEXT_SEEING_MINUTES)
  .map((k) => Number(k))
  .sort((a, b) => a - b);

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

export const CanMapping = (x: string): x is MAPPINGKEY => {
  return x in MAPPING;
};

export const CATEGORY: Category[] = ["raw", "markdown", "math"].concat(LANGUAGES);

export const CSV_SAMPLE_TEXT = `\
"Write a question in front text","Write the answer for it in back text"
"hello word in python","print('hello world')","python"
"What is the area of a circle with a radius of r?","$\\pi r^2$","math"`;
