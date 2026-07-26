/**
 * @file Defines shared application rules for Realtime Change.
 * The module keeps framework-independent calculations and contracts separate from components and
 * remote services.
 */

/**
 * Applies a single Firestore realtime event to a normalized `byId` map.
 *
 * Handles `added`, `modified`, and `removed` changes. Logical deletion
 * (items with `deletedAt` set) is already handled by the snapshot mapper
 * before the event reaches this helper — removed IDs are listed in `removed`.
 */
export const applyRealtimeChange = <T extends { id: string }>(
  prevById: Readonly<Record<string, T | undefined>>,
  event: { added?: T[]; modified?: T[]; removed?: string[] }
): Record<string, T | undefined> => {
  if ((event.added?.length ?? 0) === 0 && (event.modified?.length ?? 0) === 0 && (event.removed?.length ?? 0) === 0) {
    return prevById as Record<string, T | undefined>;
  }
  const next = { ...prevById };
  (event.added ?? []).forEach((item) => {
    next[item.id] = item;
  });
  (event.modified ?? []).forEach((item) => {
    next[item.id] = item;
  });
  (event.removed ?? []).forEach((id) => {
    delete next[id];
  });
  return next;
};
