import { collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { parseStudySessionDocument } from "./document";

export interface StudyHistoryRecord {
  deckId: string;
  startedAt: number;
  endedAt: number | null;
  endReason: "completed" | "abandoned" | null;
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
        return value === undefined
          ? []
          : [
              {
                deckId: value.deckId,
                startedAt: value.startedAt.toDate().getTime(),
                endedAt: value.endedAt?.toDate().getTime() ?? null,
                endReason: value.endReason,
              },
            ];
      });
      onRecords(records, snapshot.metadata.fromCache);
    },
    onError
  );
}
