import * as React from "react";
import type { Card } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import type { ToastId } from "@/shared/ui/toast";
import { dismissListError } from "./actions/dismissListError";
import type { BulkDifficultyRequest, ListMutationControl } from "./types";

export const useCardListState = () => {
  const isMounted = useMountedGuard();
  const [shownCard, setShownCard] = React.useState<Card>();
  const [bulkDifficulty, setBulkDifficulty] = React.useState<Difficulty | null>(null);
  const [bulkDifficultyRequest, setBulkDifficultyRequest] = React.useState<BulkDifficultyRequest>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [mutationPending, setMutationPending] = React.useState(false);
  const mutationPendingRef = React.useRef(false);
  const errorToastId = React.useRef<ToastId | undefined>(undefined);
  React.useEffect(() => () => dismissListError(errorToastId), []);
  const mutation: ListMutationControl = {
    pendingRef: mutationPendingRef,
    setPending: setMutationPending,
    errorToastId,
    isMounted,
  };
  return {
    shownCard,
    setShownCard,
    bulkDifficulty,
    setBulkDifficulty,
    bulkDifficultyRequest,
    setBulkDifficultyRequest,
    deletionTarget,
    setDeletionTarget,
    mutationPending,
    mutation,
  };
};
