import {
  doc,
  onSnapshot,
  type Query,
  type QuerySnapshot,
  Timestamp,
  type WriteBatch,
  collection,
  documentId,
  startAt,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/shared/firebase";
import type { StudyAnswerHistory, StudyAnswerInput, StudyAnswerSnapshot } from "../model/types";
import { createStudyAnswerDocument, parseStudyAnswerSnapshot, retainStudyAnswerDocuments } from "./document";
import {
  loadSyncCheckpoint,
  saveSyncCheckpoint,
  deleteSyncCheckpoint,
  readSyncTimestamp,
  readSyncChanges,
  mergeSyncChanges,
  type SyncCheckpoint,
  type SyncTimestamp,
  type SyncChange,
  type SyncedQueryResult,
} from "@/shared/api";
import { getStudyAnswerHistory } from "../model/rules";
import { z } from "zod";

export function writeStudyAnswer(batch: WriteBatch, input: StudyAnswerInput) {
  const document = createStudyAnswerDocument(input);
  batch.set(doc(db, "studyAnswer", input.id), document);
}

const studyAnswerHistoryInputSchema = z
  .object({
    uid: z.string().min(1),
    from: z.number(),
    to: z.number(),
    deckId: z.string().min(1).nullable(),
    limit: z.number().int().min(1).max(1000),
  })
  .refine(({ from, to }) => from < to, "Invalid history interval");

export function subscribeStudyAnswerHistory(
  input: z.infer<typeof studyAnswerHistoryInputSchema>,
  onHistory: (history: StudyAnswerHistory) => void,
  onError: (error: Error) => void
): () => void {
  const { uid, from, to, deckId, limit: maximum } = studyAnswerHistoryInputSchema.parse(input);
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error("History owner is not the current user");
  const anonymous = user.isAnonymous;
  const scope = JSON.stringify([db.app.options.projectId, uid, "studyAnswer", from, to, deckId, maximum]);
  const constraints = [
    where("uid", "==", uid),
    ...(deckId === null ? [] : [where("deckId", "==", deckId)]),
    where("answeredAt", ">=", Timestamp.fromMillis(from)),
    where("answeredAt", "<", Timestamp.fromMillis(to)),
  ];
  const reference = collection(db, "studyAnswer");
  const request = (cursor: SyncTimestamp | null) =>
    query(
      reference,
      ...constraints,
      // Cursor bounds retain unresolved server timestamps, unlike timestamp inequalities.
      where("updatedAt", "!=", null),
      orderBy("updatedAt"),
      orderBy("answeredAt"),
      orderBy(documentId()),
      ...(cursor ? [startAt(new Timestamp(cursor.seconds, cursor.nanoseconds))] : [])
    );
  const initial = query(
    reference,
    ...constraints,
    orderBy("answeredAt", "desc"),
    orderBy(documentId(), "desc"),
    limit(maximum + 1)
  );
  const boundaryRequest = query(
    reference,
    ...constraints,
    where("updatedAt", "!=", null),
    orderBy("updatedAt", "desc"),
    orderBy("answeredAt", "desc"),
    orderBy(documentId(), "desc"),
    limit(1)
  );
  let active = true;
  let stop: () => void = () => undefined;
  let stopBoundary: () => void = () => undefined;
  let base: SyncCheckpoint = { documents: {}, lastUpdatedAt: null };
  let baseValues = new Map<string, StudyAnswerSnapshot>();
  let restored = false;
  let published = false;
  const isActive = () => active && auth.currentUser === user;
  const fail = (cause: unknown) => {
    if (isActive()) onError(cause instanceof Error ? cause : new Error(String(cause)));
  };
  function publish(result: SyncedQueryResult<StudyAnswerSnapshot>) {
    if (!isActive()) return;
    published = true;
    try {
      onHistory(getStudyAnswerHistory(result, maximum));
    } catch (error) {
      fail(error);
    }
  }
  function restoreOnError(error: unknown) {
    if (restored && !published) publish({ values: [...baseValues.values()], fromCache: true, hasPendingWrites: false });
    fail(error);
  }
  async function restoreSaved() {
    const saved = await loadSyncCheckpoint(scope);
    if (!isActive() || !saved) return;
    try {
      const values = new Map<string, StudyAnswerSnapshot>();
      for (const [id, data] of Object.entries(saved.documents)) {
        readSyncTimestamp(data);
        values.set(id, parseStudyAnswerSnapshot(id, data));
      }
      base = saved;
      baseValues = values;
      restored = true;
    } catch {
      await deleteSyncCheckpoint(scope).catch(fail);
    }
  }
  function ingest(
    snapshot: QuerySnapshot,
    changes: Map<string, SyncChange<StudyAnswerSnapshot>>,
    boundary?: SyncTimestamp | null
  ) {
    readSyncChanges(snapshot, changes, parseStudyAnswerSnapshot);
    let merged: ReturnType<typeof mergeSyncChanges<StudyAnswerSnapshot>>;
    try {
      merged = mergeSyncChanges(base, baseValues, changes);
    } catch (error) {
      restoreOnError(error);
      return false;
    }
    const confirmed = !(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites);
    if (confirmed) {
      const documents = retainStudyAnswerDocuments(merged.documents, maximum);
      base = {
        documents,
        lastUpdatedAt: boundary === undefined ? merged.lastUpdatedAt : boundary,
      };
      baseValues = new Map([...merged.values].filter(([id]) => Object.hasOwn(documents, id)));
      void saveSyncCheckpoint(scope, base).catch(fail);
      changes.clear();
    }
    publish({
      values: [...merged.values.values()],
      fromCache: snapshot.metadata.fromCache || boundary !== undefined,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
    });
    return confirmed;
  }
  function listen(target: Query, source: "cache" | "default", boundary?: SyncTimestamp | null) {
    stop();
    let current = true;
    const isCurrent = () => isActive() && current;
    const changes = new Map<string, SyncChange<StudyAnswerSnapshot>>();
    const unsubscribe = onSnapshot(
      target,
      { includeMetadataChanges: true, source },
      (snapshot) => {
        if (!isCurrent()) return;
        const confirmed = ingest(snapshot, changes, boundary);
        if (isCurrent() && confirmed && boundary !== undefined) listen(request(base.lastUpdatedAt), "default");
      },
      (error) => {
        if (current) restoreOnError(error);
      }
    );
    stop = () => {
      current = false;
      unsubscribe();
    };
  }
  function bootstrap() {
    // Show bounded cached answers while the server establishes the initial boundary.
    listen(initial, "cache");
    stopBoundary = onSnapshot(
      boundaryRequest,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!isActive() || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
        try {
          const boundary = snapshot.docs[0] ? readSyncTimestamp(snapshot.docs[0].data()) : null;
          stopBoundary();
          listen(initial, "default", boundary);
        } catch (error) {
          fail(error);
        }
      },
      fail
    );
  }
  async function start() {
    await restoreSaved();
    if (!isActive()) return;
    if (restored) listen(request(base.lastUpdatedAt), anonymous ? "cache" : "default");
    else if (anonymous) listen(initial, "cache");
    else bootstrap();
  }
  void start().catch(fail);
  return () => {
    active = false;
    stop();
    stopBoundary();
  };
}
