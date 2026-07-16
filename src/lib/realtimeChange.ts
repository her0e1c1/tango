/**
 * Applies a single Firestore realtime event to a normalized `byId` map.
 *
 * Handles `added`, `modified`, and `removed` changes. Logical deletion
 * (items with `deletedAt` set) is already handled by the snapshot mapper
 * before the event reaches this helper — removed IDs are listed in `removed`.
 */
export const applyRealtimeChange = <T extends { id: string }>(
  prevById: Record<string, T | undefined>,
  event: { added?: T[]; modified?: T[]; removed?: string[] }
): Record<string, T | undefined> => {
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
