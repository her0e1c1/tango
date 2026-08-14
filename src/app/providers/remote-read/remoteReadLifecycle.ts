import { startCardReads, stopCardReads } from "@/features/card/read";
import { startDeckReads, stopDeckReads } from "@/features/deck/read";

export const stopRemoteReads = (uid: string) => {
  try {
    stopCardReads(uid);
  } finally {
    stopDeckReads(uid);
  }
};

export const startRemoteReads = (uid: string) => {
  startCardReads(uid);
  startDeckReads(uid);
};
