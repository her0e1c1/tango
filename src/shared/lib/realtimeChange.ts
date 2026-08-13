/**
 * @file Defines shared application rules for Realtime Change.
 * The module keeps framework-independent calculations and contracts separate from components and
 * remote services.
 */

/**
 * Applies a single Firestore realtime event to a normalized keyed map.
 *
 * Handles `added`, `modified`, and `removed` changes. Logical deletion
 * (items with `deletedAt` set) is already handled by the snapshot mapper
 * before the event reaches this helper — removed keys are listed in `removed`.
 */
export const applyRealtimeChange = <T>(
  prevById: Readonly<Record<string, T | undefined>>,
  event: { added?: T[]; modified?: T[]; removed?: string[] },
  keyOf: (item: T) => string
): Record<string, T | undefined> => {
  const { added = [], modified = [], removed = [] } = event;
  if (added.length === 0 && modified.length === 0 && removed.length === 0) {
    return prevById as Record<string, T | undefined>;
  }
  const next = { ...prevById };
  added.forEach((item) => {
    next[keyOf(item)] = item;
  });
  modified.forEach((item) => {
    next[keyOf(item)] = item;
  });
  removed.forEach((id) => {
    delete next[id];
  });
  return next;
};
