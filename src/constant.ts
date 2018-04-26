export * from 'src/secret';

export const CATEGORY: Category[] = [
  'math',
  'python',
  'golang',
  'haskell',
  'raw',
];

export const CURRENT_VERSION = 7;

export const GOOGLE_AUTH_SCOPE = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'profile',
  'email',
];
