export * from 'src/secret';

export const NEXT_SEEING_MINUTES = {
  0: 'soon',
  60: '1 hour later',
  [60 * 4]: '4 hours later',
  [60 * 8]: '8 hours later',
  [60 * 24]: '1 day later',
  [60 * 24 * 2]: '2 days later',
  [60 * 24 * 3]: '3 days later',
  [60 * 24 * 7]: '1 week later',
  [60 * 24 * 7 * 2]: '2 weeks later',
  [60 * 24 * 30]: '1 month later',
  [60 * 24 * 30 * 2]: '2 months later',
  [60 * 24 * 30 * 6]: '6 months later',
  [60 * 24 * 365]: '1 year later',
};

export const NEXT_SEEING_MINUTES_KEYS = Object.keys(NEXT_SEEING_MINUTES)
  .map(k => Number(k))
  .sort((a, b) => a - b);

export const LANGUAGES = [
  'c',
  'cpp',
  'kotlin',
  'python',
  'golang',
  'java',
  'javascript',
  'haskell',
  'php',
  'ruby',
  'shell',
  'sh',
  'swift',
];

export const MAPPING = {
  hs: 'haskell',
  go: 'golang',
  js: 'javascript',
  py: 'python',
  rb: 'ruby',
};

export const CATEGORY: Category[] = ['raw', 'markdown', 'math'].concat(
  LANGUAGES
);

export const CURRENT_VERSION = 10;

export const GOOGLE_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'profile',
  'email',
];

export const URL_GOOGLE_TOKEN = 'https://accounts.google.com/o/oauth2/token';
