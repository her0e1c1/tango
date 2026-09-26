import { calculateFsrsState } from "@/entities/card";
import "@/test/initializeTestFirestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  collection,
  disableNetwork,
  doc,
  enableNetwork,
  getDocFromCache,
  getDocsFromCache,
  waitForPendingWrites,
} from "firebase/firestore";
import { replaceAuthSession } from "@/entities/auth";
import { createCard, deleteCard, editCard, getCards } from "@/entities/card";
import { createDeck, deleteDeck, getDecks } from "@/entities/deck";
import { getStudySession, startStudy } from "@/entities/study-session";
import { saveStudyOperation } from "@/pages/study-session/model/actions/saveStudyOperation";
import type { StudyRating } from "@/entities/study-answer";
import type { StudySession } from "@/entities/study-session";

function saveStudyAnswer(uid: string, session: StudySession, rating: StudyRating, answeredAt: number) {
  const card = getCards().find(({ id }) => id === session.cardOrderIds[session.currentIndex]);
  if (!card) throw new Error("Missing card");
  const fsrs = calculateFsrsState(card.fsrs, rating, answeredAt);
  return saveStudyOperation(
    {
      id: crypto.randomUUID(),
      uid,
      sessionId: session.sessionId,
      deckId: session.deckId,
      cardId: card.id,
      currentIndex: session.currentIndex,
      cardCount: session.cardOrderIds.length,
      answeredAt,
      rating,
      fsrs,
    },
    session
  );
}
import { startFirestoreSubscriptions } from "@/app/firestore-subscriptions";
import { createCard as cardFixture } from "@/test/factories";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
  writeBatch: (await import("firebase/firestore")).writeBatch,
}));

let stop: () => void = () => undefined;
let deckId: string;
beforeEach(async () => {
  await disableNetwork(testDb);
  replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: true, displayName: null });
  const subscription = startFirestoreSubscriptions("uid");
  ({ stop } = subscription);
  await subscription.ready;
  deckId = crypto.randomUUID();
});
afterEach(async () => {
  stop();
  await disableNetwork(testDb);
  await enableNetwork(testDb);
  await waitForPendingWrites(testDb);
  localStorage.clear();
});

describe("Firestore cache mutations [CARD-MANAGEMENT-02 PERSISTENCE-02 PERSISTENCE-04 STUDY-SESSION-05]", () => {
  it("completes offline Card writes and hides every child after deleting its Deck", async () => {
    await createDeck("uid", { id: deckId, name: "Offline" });
    await vi.waitFor(() => expect(getDecks().some((deck) => deck.id === deckId)).toBe(true));
    const first = cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" });
    const second = cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" });
    await createCard("uid", first);
    await createCard("uid", second);
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toHaveLength(2));
    await editCard("uid", { id: first.id, frontText: "Edited offline" });
    await vi.waitFor(async () =>
      expect((await getDocFromCache(doc(testDb, "card", first.id))).data()?.frontText).toBe("Edited offline")
    );
    await deleteCard("uid", first.id);
    await vi.waitFor(() => expect(getCards().some((card) => card.id === first.id)).toBe(false));
    await deleteDeck("uid", deckId);
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toEqual([]));
  });

  it("saves one answer, state and session advancement atomically while offline", async () => {
    await createDeck("uid", { id: deckId, name: "Study offline" });
    const cards = [0, 1].map(() => cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" }));
    await vi.waitFor(() => expect(getDecks().some((deck) => deck.id === deckId)).toBe(true));
    await Promise.all(cards.map((card) => createCard("uid", card)));
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toHaveLength(2));
    startStudy({ deckId, cardOrderIds: cards.map(({ id }) => id), uid: "uid" });
    await vi.waitFor(() => expect(getStudySession(deckId)).toBeDefined());
    const session = getStudySession(deckId);
    if (!session) throw new Error("Missing session");
    const answeredAt = 1_800_000_000_000;
    saveStudyAnswer("uid", session, "good", answeredAt);
    await vi.waitFor(() => expect(getStudySession(deckId)?.currentIndex).toBe(1));
    const answers = await getDocsFromCache(collection(testDb, "studyAnswer"));
    const answer = answers.docs.find((item) => item.data().sessionId === session.sessionId)?.data();
    expect(answer).toMatchObject({ cardId: cards[0]?.id, answer: { type: "rating", rating: "good" } });
    expect(answer?.answeredAt.toMillis()).toBe(answeredAt);
    expect((await getDocFromCache(doc(testDb, "card", cards[0]?.id ?? "missing"))).data()).toMatchObject({
      updatedAt: null,
      fsrs: { reps: 1, lastReviewedAt: answeredAt, dueAt: answeredAt + 600_000 },
    });
    const savedSchedule = getCards().find((card) => card.id === cards[0]?.id)?.fsrs;
    expect(savedSchedule).toBeDefined();
    stop();
    const subscription = startFirestoreSubscriptions("uid");
    ({ stop } = subscription);
    await subscription.ready;
    expect(getCards().find((card) => card.id === cards[0]?.id)?.fsrs).toEqual(savedSchedule);
    expect(() => saveStudyAnswer("uid", session, "good", answeredAt)).toThrow("session does not match");
    const final = getStudySession(deckId);
    if (!final) throw new Error("Missing final position");
    saveStudyAnswer("uid", final, "again", answeredAt + 1);
    await vi.waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
    expect((await getDocFromCache(doc(testDb, "studySession", session.sessionId))).data()?.endReason).toBe("completed");
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    const synced = await getDocsFromCache(collection(testDb, "studyAnswer"));
    expect(synced.docs.filter((item) => item.data().sessionId === session.sessionId)).toHaveLength(2);
  });
});
