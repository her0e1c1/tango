const tails = new Map<string, Promise<void>>();

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

export const cardMutationLock = (id: CardId) => `card:${id}`;
export const deckMutationLock = (id: DeckId) => `deck:${id}`;
