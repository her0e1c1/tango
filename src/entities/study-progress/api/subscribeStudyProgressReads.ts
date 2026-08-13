import { collection, query, where } from "firebase/firestore";

import type { RemoteSubscriptionProps } from "@/shared/api";
import { getDb, subscribeReads } from "@/shared/firestore";
import { parseCardDocument } from "@/entities/card/@x/study-progress";
import { mapStudyProgressDocument } from "./firestoreDocument";

export interface StudyProgressRead {
  id: string;
  cardId: string;
  score: number;
  numberOfSeen: number;
  lastSeenAt?: number;
  nextSeeingAt?: Date;
  interval?: number;
  deletedAt: number | null;
}

export const subscribeStudyProgressReads = (props: RemoteSubscriptionProps<StudyProgressRead>): (() => void) =>
  subscribeReads({
    query: query(collection(getDb(), "card"), where("uid", "==", props.uid)),
    mapDocument: (id, value) => ({
      ...mapStudyProgressDocument(id, value),
      id,
      deletedAt: parseCardDocument(id, value).deletedAt,
    }),
    isActive: (progress) => progress.deletedAt === null,
    onSnapshot: props.onSnapshot,
    onError: props.onError,
  });
