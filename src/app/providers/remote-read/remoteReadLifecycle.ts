import { startCardReads, stopCardReads } from "@/entities/card";
import { startDeckReads, stopDeckReads } from "@/entities/deck";
import { startStudyProgressReads, stopStudyProgressReads } from "@/entities/study-progress";

export const stopRemoteReads = (uid: string) => {
  try {
    stopCardReads(uid);
  } finally {
    try {
      stopDeckReads(uid);
    } finally {
      stopStudyProgressReads(uid);
    }
  }
};

export const startRemoteReads = async (uid: string): Promise<void> => {
  // Entity stores expose their own setup failures; completing this transition keeps
  // successful peers registered for later auth cleanup and independent use.
  await Promise.allSettled([startCardReads(uid), startDeckReads(uid), startStudyProgressReads(uid)]);
};
