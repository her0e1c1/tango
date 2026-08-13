interface ResourceAccessState {
  exclusive?: Promise<void>;
  shared: Set<Promise<void>>;
}

const accessStates = new Map<string, ResourceAccessState>();

export const resourceKey = (namespace: string, ...identifiers: string[]): string =>
  JSON.stringify([namespace, ...identifiers]);

export const withResourceAccess = async <T>(
  keys: string[],
  mode: "shared" | "exclusive",
  task: () => Promise<T>
): Promise<T> => {
  const uniqueKeys = [...new Set(keys)];
  const states = uniqueKeys.map<ResourceAccessState>((key) => {
    const existing = accessStates.get(key);
    if (existing != null) return existing;
    const created: ResourceAccessState = { shared: new Set() };
    accessStates.set(key, created);
    return created;
  });
  const previous = states.flatMap((state) => {
    if (mode === "shared") return state.exclusive == null ? [] : [state.exclusive];
    return [...(state.exclusive == null ? [] : [state.exclusive]), ...state.shared];
  });
  const operation = Promise.all(previous).then(task);
  const settled = operation.then(
    () => undefined,
    () => undefined
  );
  states.forEach((state) => {
    if (mode === "shared") state.shared.add(settled);
    else state.exclusive = settled;
  });
  try {
    return await operation;
  } finally {
    states.forEach((state, index) => {
      if (mode === "shared") state.shared.delete(settled);
      else if (state.exclusive === settled) delete state.exclusive;
      const key = uniqueKeys[index];
      if (key != null && state.exclusive == null && state.shared.size === 0 && accessStates.get(key) === state) {
        accessStates.delete(key);
      }
    });
  }
};
