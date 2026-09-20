import { collection, doc, getDocsFromServer, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { compareStudySessionCreation } from "../model/rules";
import { parseStudySessionDocument, toStudySessionWrite } from "./document";

// Only creation of a new run invokes this: navigation and ordinary progress never abandon another run.
export async function finishSupersededStudySessions(uid: string, deckId: string, sessionId: string): Promise<void> {
  const active = await getDocsFromServer(
    query(
      collection(db, "studySession"),
      where("uid", "==", uid),
      where("deckId", "==", deckId),
      where("endReason", "==", null)
    )
  );
  const references = active.docs.map((item) => item.ref);
  // An offline start may already be completed by its first successful upload.
  if (!references.some(({ id }) => id === sessionId)) references.push(doc(db, "studySession", sessionId));
  await runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all(references.map((reference) => transaction.get(reference)));
    const sessions = snapshots
      .map((snapshot) => ({
        reference: snapshot.ref,
        ...toStudySessionWrite(snapshot.id, parseStudySessionDocument(snapshot.id, snapshot.data())),
      }))
      .sort((left, right) => compareStudySessionCreation(right.session, left.session));
    // Every concurrently created run reconciles after its own commit; the final creator observes earlier runs.
    for (const superseded of sessions.slice(1)) {
      if (superseded.endReason === null) {
        transaction.update(superseded.reference, {
          endReason: "abandoned",
          endedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  });
}
