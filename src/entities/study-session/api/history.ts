import { collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { parseStudySessionDocument } from "./document";

export interface StudyHistoryRecord {
  sessionId: string;
  deckId: string;
  startedAt: number;
  endedAt: number | null;
  endReason: "completed" | "abandoned" | null;
  cardCount: number;
  occurredAt: number;
}

export interface StudyHistoryPeriod {
  start: number;
  end: number;
}

export function subscribeStudyHistory(
  {
    uid,
    period,
    deckId,
    metric,
  }: { uid: string; period: StudyHistoryPeriod; deckId: string | null; metric: "started" | "completed" },
  onRecords: (records: StudyHistoryRecord[], fromCache: boolean) => void,
  onError: (error: Error) => void
): () => void {
  const field = metric === "started" ? "startedAt" : "endedAt";
  return onSnapshot(
    query(
      collection(db, "studySession"),
      where("uid", "==", uid),
      ...(deckId === null ? [] : [where("deckId", "==", deckId)]),
      ...(metric === "completed" ? [where("endReason", "==", "completed")] : []),
      where(field, ">=", Timestamp.fromMillis(period.start)),
      where(field, "<", Timestamp.fromMillis(period.end))
    ),
    { includeMetadataChanges: true },
    (snapshot) => {
      const records = snapshot.docs.flatMap((item) => {
        // Estimates also permit legacy pending server timestamps to appear before acknowledgement.
        const value = parseStudySessionDocument(item.data({ serverTimestamps: "estimate" }));
        if (value === undefined) return [];
        const occurredAt = metric === "started" ? value.startedAt : value.endedAt;
        return occurredAt === null
          ? []
          : [
              {
                sessionId: item.id,
                deckId: value.deckId,
                startedAt: value.startedAt.seconds * 1000 + value.startedAt.nanoseconds / 1_000_000,
                endedAt:
                  value.endedAt === null ? null : value.endedAt.seconds * 1000 + value.endedAt.nanoseconds / 1_000_000,
                endReason: value.endReason,
                cardCount: value.cardOrderIds.length,
                occurredAt: occurredAt.toDate().getTime(),
              },
            ];
      });
      onRecords(records, snapshot.metadata.fromCache);
    },
    onError
  );
}
