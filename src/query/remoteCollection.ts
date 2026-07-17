import { isEqual } from "lodash";

export type RemoteById<T> = Record<string, T | undefined>;

export const toRemoteById = <T extends { id: string }>(items: T[]): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

interface OptimisticMutationOptions<T, Result> {
  targetIds: string[];
  read: () => RemoteById<T>;
  replace: (next: RemoteById<T>) => void;
  update: (previous: RemoteById<T>) => RemoteById<T>;
  mutation: () => Promise<Result>;
}

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
