interface MembershipLockState {
  exclusive?: Promise<void>;
  shared: Set<Promise<void>>;
}

const membershipLocks = new Map<string, MembershipLockState>();

export const withDeckMembershipLocks = async <T>(
  keys: string[],
  mode: "shared" | "exclusive",
  task: () => Promise<T>
): Promise<T> => {
  const uniqueKeys = [...new Set(keys)];
  const states = uniqueKeys.map<MembershipLockState>((key) => {
    const existing = membershipLocks.get(key);
    if (existing != null) return existing;
    const created: MembershipLockState = { shared: new Set() };
    membershipLocks.set(key, created);
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
      if (key != null && state.exclusive == null && state.shared.size === 0 && membershipLocks.get(key) === state) {
        membershipLocks.delete(key);
      }
    });
  }
};

export const deckMembershipMutationLock = (uid: string, id: string) => `deck-membership:${uid}:${id}`;
export const deckMutationLock = (uid: string, id: string) => `deck:${uid}:${id}`;
