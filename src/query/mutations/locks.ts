/**
 * @file Coordinates remote mutation behavior for Locks.
 * It applies optimistic cache changes, serializes conflicting work, and restores consistent state
 * when a request fails.
 */

const tails = new Map<string, Promise<void>>();

/**
 * Serializes a task behind all earlier mutations that touch the same entity keys.
 * Locks are released after success or failure, allowing unrelated entities to continue in
 * parallel.
 */
export const withMutationLocks = async <T>(keys: string[], task: () => Promise<T>): Promise<T> => {
  const uniqueKeys = [...new Set(keys)];
  const previous = uniqueKeys.map((key) => tails.get(key)).filter((tail): tail is Promise<void> => tail != null);
  const operation = Promise.all(previous).then(task);
  const settled = operation.then(
    () => undefined,
    () => undefined
  );
  uniqueKeys.forEach((key) => {
    tails.set(key, settled);
  });
  try {
    return await operation;
  } finally {
    uniqueKeys.forEach((key) => {
      if (tails.get(key) === settled) tails.delete(key);
    });
  }
};

/**
 * Builds the lock key used to serialize mutations for one card.
 * The user identifier keeps sessions independent, and the `card:` prefix separates entity types.
 */
export const cardMutationLock = (uid: string, id: CardId) => `card:${uid}:${id}`;
/**
 * Builds the lock key used to serialize mutations for one deck.
 * The user identifier keeps sessions independent, and the `deck:` prefix separates entity types.
 */
export const deckMutationLock = (uid: string, id: DeckId) => `deck:${uid}:${id}`;
