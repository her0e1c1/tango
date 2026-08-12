import { startCardReads, stopCardReads } from "@/entities/card";
import { startDeckReads, stopDeckReads } from "@/entities/deck";

export const stopRemoteReads = (uid: string) => {
  try {
    stopCardReads(uid);
  } finally {
    stopDeckReads(uid);
  }
};

export const startRemoteReads = async (uid: string): Promise<void> => {
  try {
    await Promise.all([startCardReads(uid), startDeckReads(uid)]);
  } catch (cause) {
    try {
      stopRemoteReads(uid);
    } catch {
      // Preserve the start failure after attempting both compensating cleanups.
    }
    throw cause;
  }
};
