import { startCardReads, stopCardReads } from "@/entities/card";
import { startDeckReads, stopDeckReads } from "@/entities/deck";

const runRemoteReadActions = async (actions: ReadonlyArray<() => unknown | Promise<unknown>>): Promise<void> => {
  const results = await Promise.allSettled(actions.map(async (action) => action()));
  const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failure) throw failure.reason;
};

export const stopRemoteReads = (uid: string) =>
  runRemoteReadActions([() => stopCardReads(uid), () => stopDeckReads(uid)]);

export const startRemoteReads = async (uid: string): Promise<void> => {
  try {
    await runRemoteReadActions([() => startCardReads(uid), () => startDeckReads(uid)]);
  } catch (cause) {
    try {
      await stopRemoteReads(uid);
    } catch {
      // Preserve the start failure after attempting both compensating cleanups.
    }
    throw cause;
  }
};
