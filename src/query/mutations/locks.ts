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
 * The `card:` prefix keeps card locks separate from deck locks with the same identifier.
 */
export const cardMutationLock = (id: CardId) => `card:${id}`;
/**
 * Builds the lock key used to serialize mutations for one deck.
 * The `deck:` prefix keeps deck locks separate from card locks with the same identifier.
 */
export const deckMutationLock = (id: DeckId) => `deck:${id}`;
