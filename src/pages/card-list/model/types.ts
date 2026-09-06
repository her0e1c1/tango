import type { RefObject } from "react";
import type { CardId } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";
import type { ToastId } from "@/shared/ui/toast";

export interface BulkDifficultyRequest {
  cardIds: CardId[];
  difficulty: Difficulty;
}

// Every list mutation shares this lock, including gestures in the same render tick.
export interface ListMutationControl {
  pendingRef: RefObject<boolean>;
  setPending: (pending: boolean) => void;
  errorToastId: RefObject<ToastId | undefined>;
  isMounted: () => boolean;
}
