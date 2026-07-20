/**
 * @file Defines remote query cache behavior for Firestore Keys.
 * The cache keeps Firestore data indexed by user and identifier so reads and optimistic mutations
 * share one source of truth.
 */

export const firestoreKeys = {
  uid: (uid: string) => Object.freeze(["firestore", uid] as const),
  decks: (uid: string) => Object.freeze(["firestore", uid, "decks"] as const),
  cards: (uid: string) => Object.freeze(["firestore", uid, "cards"] as const),
};
