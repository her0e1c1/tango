export * from 'src/secret';

export const CATEGORY: Category[] = [
  'raw',
  'markdown',
  'math',
  'python',
  'golang',
  'haskell',
];

export const CURRENT_VERSION = 9;

export const GOOGLE_AUTH_SCOPE = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'profile',
  'email',
];
