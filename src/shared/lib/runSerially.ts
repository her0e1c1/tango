const tails = new Map<unknown, Promise<void>>();

export const runSerially = async <Key, T>(key: Key, task: () => Promise<T>): Promise<T> => {
  const previous = tails.get(key);
  const operation = (previous ?? Promise.resolve()).then(task);
  const settled = operation.then(
    () => undefined,
    () => undefined
  );
  tails.set(key, settled);

  try {
    return await operation;
  } finally {
    if (tails.get(key) === settled) tails.delete(key);
  }
};
