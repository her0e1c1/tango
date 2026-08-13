import { startCardReads, stopCardReads } from "@/features/card/read";
import { startDeckReads, stopDeckReads } from "@/features/deck/read";

export const stopRemoteReads = (uid: string) => {
  try {
    stopCardReads(uid);
  } finally {
    stopDeckReads(uid);
  }
};

export const startRemoteReads = async (uid: string): Promise<void> => {
  // Read stores expose their own setup failures; completing this transition keeps
  // successful peers registered for later auth cleanup and independent use.
  await Promise.allSettled([startCardReads(uid), startDeckReads(uid)]);
};
