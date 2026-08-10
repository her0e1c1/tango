/** @file Provides bounded and append-only Firestore access for StudyAttempt documents. */

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  limit as applyLimit,
  orderBy,
  query,
  setDoc,
  where,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";

import { getDb } from "@/adapters/firestore/runtime";
import {
  buildStudyAttemptCreateDto,
  mapStudyAttemptDocument,
  type StudyAttemptDocumentV1,
} from "@/adapters/firestore/studyAttemptDto";
import type { StudyAttempt, StudyAttemptRange } from "@/domain/studyHistory";

export const MAX_STUDY_ATTEMPT_QUERY_LIMIT = 6_001;

export class InvalidStudyAttemptQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStudyAttemptQueryError";
  }
}

export interface StudyAttemptWrite {
  reference: DocumentReference;
  data: StudyAttemptDocumentV1;
}

const validateQuery = (uid: string, range: StudyAttemptRange) => {
  if (uid.trim().length === 0) {
    throw new InvalidStudyAttemptQueryError("StudyAttempt query requires a non-empty UID");
  }
  if (!Number.isSafeInteger(range.fromInclusive) || !Number.isSafeInteger(range.toExclusive)) {
    throw new InvalidStudyAttemptQueryError("StudyAttempt query bounds must be safe integer timestamps");
  }
  if (range.fromInclusive >= range.toExclusive) {
    throw new InvalidStudyAttemptQueryError("StudyAttempt query requires fromInclusive before toExclusive");
  }
  if (!Number.isInteger(range.limit) || range.limit < 1 || range.limit > MAX_STUDY_ATTEMPT_QUERY_LIMIT) {
    throw new InvalidStudyAttemptQueryError(
      `StudyAttempt query limit must be an integer from 1 to ${MAX_STUDY_ATTEMPT_QUERY_LIMIT}`
    );
  }
};

export const buildStudyAttemptWrite = (attempt: StudyAttempt, firestore?: Firestore): StudyAttemptWrite => {
  const data = buildStudyAttemptCreateDto(attempt);
  return { reference: doc(firestore ?? getDb(), "studyAttempt", attempt.id), data };
};

export const createStudyAttempt = async (attempt: StudyAttempt, firestore?: Firestore): Promise<void> => {
  const write = buildStudyAttemptWrite(attempt, firestore);
  await setDoc(write.reference, write.data);
};

export const readStudyAttempts = async (
  uid: string,
  range: StudyAttemptRange,
  firestore?: Firestore
): Promise<StudyAttempt[]> => {
  validateQuery(uid, range);
  const database = firestore ?? getDb();
  const snapshot = await getDocs(
    query(
      collection(database, "studyAttempt"),
      where("uid", "==", uid),
      where("answeredAt", ">=", Timestamp.fromMillis(range.fromInclusive)),
      where("answeredAt", "<", Timestamp.fromMillis(range.toExclusive)),
      orderBy("answeredAt", "desc"),
      applyLimit(range.limit)
    )
  );
  return snapshot.docs.map((document) => mapStudyAttemptDocument(document.id, document.data()));
};
