import { startCardReads, stopCardReads } from "@/entities/card";
import { startDeckReads, stopDeckReads } from "@/entities/deck";

const runRemoteReadActions = async (actions: ReadonlyArray<() => unknown | Promise<unknown>>): Promise<void> => {
  const results = await Promise.allSettled(actions.map(async (action) => action()));
  const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failure) throw failure.reason;
};

export const startRemoteReads = (uid: string) =>
  runRemoteReadActions([() => startCardReads(uid), () => startDeckReads(uid)]);

export const stopRemoteReads = (uid: string) =>
  runRemoteReadActions([() => stopCardReads(uid), () => stopDeckReads(uid)]);
