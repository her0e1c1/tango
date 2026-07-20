/** @file Serializes conflicting remote mutations. */

const tails = new Map<string, Promise<void>>();
interface MembershipLockState {
  exclusive?: Promise<void>;
  shared: Set<Promise<void>>;
}
const membershipLocks = new Map<string, MembershipLockState>();

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
 * Allows concurrent Card writes while giving Deck removal exclusive access to its membership.
 */
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

/**
 * Builds the lock key used to serialize mutations for one card.
 * The user identifier keeps sessions independent, and the `card:` prefix separates entity types.
 */
export const cardMutationLock = (uid: string, id: CardId) => `card:${uid}:${id}`;
/** Builds the lock key shared by Deck removal and Card membership writes. */
export const deckMembershipMutationLock = (uid: string, id: DeckId) => `deck-membership:${uid}:${id}`;
/**
 * Builds the lock key used to serialize mutations for one deck.
 * The user identifier keeps sessions independent, and the `deck:` prefix separates entity types.
 */
export const deckMutationLock = (uid: string, id: DeckId) => `deck:${uid}:${id}`;
