import { useMemo } from "react";
import { useStore } from "zustand";

import type { StudyProgress } from "../model/studyProgress";
import { studyProgressRemoteReadStore } from "../model/remoteReadStore";
import { useRemoteReadScopeUid } from "@/shared/lib/remote-read";

const EMPTY_PROGRESS: Readonly<Record<string, StudyProgress | undefined>> = {};

export const useStudyProgresses = () => {
  const uid = useRemoteReadScopeUid();
  const remote = useStore(studyProgressRemoteReadStore);
  const hasActiveUid = uid !== null && remote.uid === uid;
  const progressesByCardId = useMemo(
    () =>
      hasActiveUid
        ? Object.fromEntries(
            Object.values(remote.itemsById).flatMap((item) => (item == null ? [] : [[item.cardId, item]]))
          )
        : EMPTY_PROGRESS,
    [hasActiveUid, remote.itemsById]
  );

  return {
    progressesByCardId,
    status: uid === null ? ("idle" as const) : hasActiveUid ? remote.status : ("loading" as const),
    syncStatus: hasActiveUid && remote.status === "ready" ? remote.syncStatus : undefined,
    error: hasActiveUid && (remote.status === "error" || remote.status === "blocked") ? remote.error : undefined,
    retry: remote.retry,
  };
};
