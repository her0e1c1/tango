export * from 'src/secret';

export const LANGUAGES = [
  'c',
  'cpp',
  'kotlin',
  'python',
  'py',
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
