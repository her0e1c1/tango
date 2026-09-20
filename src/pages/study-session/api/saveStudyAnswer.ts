import { doc, Timestamp, writeBatch } from "firebase/firestore";
import { z } from "zod";

import { getAuthUid } from "@/entities/auth";
import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";
import { resolveStudyRating, type StudyRating } from "@/entities/study-progress";
import { getStudySession, type StudySession, planStudySessionSwipe } from "@/entities/study-session";
import { writeLocally } from "@/shared/firestore-write";
import { db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";

const ratingSchema: z.ZodType<StudyRating> = z.enum(["again", "hard", "good", "easy"]);
const answerSchema = z.object({ type: z.literal("rating"), rating: ratingSchema });

export async function saveStudyAnswer(
  uid: string,
  session: StudySession,
  action: Preferences["controls"]["cardSwipeUp"],
  answeredAt: number
): Promise<void> {
  const current = getStudySession(session.deckId);
  const cardId = session.cardOrderIds[session.currentIndex];
  const card = getCards().find((value) => value.id === cardId);
  const deck = getDecks().find((value) => value.id === session.deckId);
  if (
    !uid ||
    getAuthUid() !== uid ||
    session.remote?.uid !== uid ||
    card?.uid !== uid ||
    deck?.uid !== uid ||
    current?.sessionId !== session.sessionId ||
    current.currentIndex !== session.currentIndex ||
    card.deckId !== deck.id
  ) {
    throw new Error("The study position or owner changed");
  }
  const plan = planStudySessionSwipe(session, [card], action, answeredAt);
  if (plan.effect !== "next") return;
  const rating = resolveStudyRating(action);
  const batch = writeBatch(db);
  const cardReference = doc(db, "card", card.id);
  const sessionReference = doc(db, "studySession", session.sessionId);
  const references = [cardReference, sessionReference];
  const timestamp = Timestamp.fromMillis(answeredAt);
  if (rating !== undefined) {
    // A session visits a position only once. The stable identity also survives SDK offline replay.
    const answerReference = doc(db, "studyAnswer", `${session.sessionId}-${String(session.currentIndex)}`);
    batch.set(answerReference, {
      uid,
      sessionId: session.sessionId,
      deckId: session.deckId,
      cardId,
      answer: answerSchema.parse({ type: "rating", rating }),
      answeredAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    references.push(answerReference);
  }
  const { cardId: _cardId, ...progress } = plan.progress;
  batch.update(cardReference, omitUndefined({ ...progress, updatedAt: answeredAt }));
  const completed = session.currentIndex + 1 === session.cardOrderIds.length;
  batch.update(sessionReference, {
    currentIndex: completed ? session.currentIndex : session.currentIndex + 1,
    ...(completed ? { endReason: "completed", endedAt: timestamp } : {}),
    updatedAt: timestamp,
  });
  await writeLocally(uid, references, () => batch.commit());
}
