import type { EditStudyProgressInput } from "../model/types";

import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";

import { parseCardDocument } from "@/entities/card/@x/study-progress";
import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { editStudyProgressSchema } from "../model/schema";
import { replaceRemoteStudyProgresses } from "../model/store";
import { mapStudyProgressDocument } from "./document";

export const subscribeStudyProgresses = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, "card"), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const progresses = snapshot.docs
          .filter((document) => parseCardDocument(document.id, document.data()).deletedAt === null)
          .map((document) => mapStudyProgressDocument(document.id, document.data()));
        replaceRemoteStudyProgresses(progresses);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

export const editStudyProgress = async (uid: string, progress: EditStudyProgressInput["progress"]): Promise<void> => {
  const input = editStudyProgressSchema.parse({ uid, progress });
  const { cardId, ...fields } = input.progress;
  const document = omitUndefined({ ...fields, updatedAt: getCurrentTimeMillis() });
  await updateDoc(doc(db, "card", cardId), document);
};
