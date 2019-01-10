export * from 'src/secret';

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
  'swift',
];

export const CATEGORY: Category[] = ['raw', 'markdown', 'math'].concat(
  LANGUAGES
);

export const CURRENT_VERSION = 9;

export const GOOGLE_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'profile',
  'email',
];
