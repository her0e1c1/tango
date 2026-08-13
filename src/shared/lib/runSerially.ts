const tails = new Map<unknown, Promise<void>>();

const runTask = <T>(task: () => Promise<T>): Promise<T> => {
  try {
    return Promise.resolve(task());
  } catch (error) {
    return Promise.reject(error);
  }
};

export const runSerially = async <Key, T>(key: Key, task: () => Promise<T>): Promise<T> => {
  const previous = tails.get(key);
  const operation = previous == null ? runTask(task) : previous.then(task);
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
