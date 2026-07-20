/**
 * @file Coordinates remote mutation behavior for Optimistic Mutation.
 * It applies optimistic cache changes, serializes conflicting work, and restores consistent state
 * when a request fails.
 */

import { isEqual } from "lodash";

import type { RemoteById } from "@/query/cache/remoteCollection";

export interface OptimisticMutationOptions<T, Result> {
  targetIds: string[];
  read: () => RemoteById<T>;
  replace: (next: RemoteById<T>) => void;
  update: (previous: RemoteById<T>) => RemoteById<T>;
  mutation: () => Promise<Result>;
}

/**
 * Runs the optimistic mutation workflow for the remote-data layer.
 * The sequence and its cleanup remain together so partial failures can be handled consistently.
 */
export const runOptimisticMutation = async <T, Result>({
  targetIds,
  read,
  replace,
  update,
  mutation,
}: OptimisticMutationOptions<T, Result>): Promise<Result> => {
  const previous = read();
  const optimistic = update(previous);
  replace(optimistic);

  try {
    return await mutation();
  } catch (error) {
    const current = read();
    const rollback = { ...current };
    targetIds.forEach((id) => {
      if (!isEqual(current[id], optimistic[id])) return;
      const previousItem = previous[id];
      if (previousItem == null) delete rollback[id];
      else rollback[id] = previousItem;
    });
    replace(rollback);
    throw error;
  }
};
