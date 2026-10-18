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
  auth: { currentUser: { uid: "uid", isAnonymous: true } },
}));

let stop: () => void = () => undefined;
let deckId: string;
beforeEach(async () => {
  // Given: Establish the shared setup used by the following cases.
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

describe("Firestore cache mutations [CARD-MANAGEMENT-02 PERSISTENCE-05 STUDY-SESSION-07]", () => {
  it("completes anonymous Card writes without a server acknowledgement and hides every child after deleting its Deck", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `createDeck` with the prepared inputs.
    await createDeck("uid", { id: deckId, name: "Offline" });
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getDecks().some((deck) => deck.id === deckId)).toBe(true));
    const first = cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" });
    const second = cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" });
    // When: Exercise `createCard` with the prepared inputs.
    await createCard("uid", first);
    await createCard("uid", second);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toHaveLength(2));
    // When: Exercise `editCard` with the prepared inputs.
    await editCard("uid", { id: first.id, frontText: "Edited offline" });
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(async () =>
      expect((await getDocFromCache(doc(testDb, "card", first.id))).data()?.frontText).toBe("Edited offline")
    );
    // When: Exercise `deleteCard` with the prepared inputs.
    await deleteCard("uid", first.id);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getCards().some((card) => card.id === first.id)).toBe(false));
    // When: Exercise `deleteDeck` with the prepared inputs.
    await deleteDeck("uid", deckId);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toEqual([]));
  });

  it("saves one answer, state and session advancement while offline", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `createDeck` with the prepared inputs.
    await createDeck("uid", { id: deckId, name: "Study offline" });
    const cards = [0, 1].map(() => cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" }));
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getDecks().some((deck) => deck.id === deckId)).toBe(true));
    await Promise.all(cards.map((card) => createCard("uid", card)));
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toHaveLength(2));
    // When: Exercise `startStudy` with the prepared inputs.
    await startStudy({ deckId, cardOrderIds: cards.map(({ id }) => id), uid: "uid" });
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getStudySession(deckId)).toBeDefined());
    // When: Exercise `getStudySession` with the prepared inputs.
    const session = getStudySession(deckId);
    if (!session) throw new Error("Missing session");
    const answeredAt = 1_800_000_000_000;
    await saveStudyAnswer("uid", session, "good", answeredAt);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getStudySession(deckId)?.currentIndex).toBe(1));
    const answers = await getDocsFromCache(collection(testDb, "studyAnswer"));
    const answer = answers.docs.find((item) => item.data().sessionId === session.sessionId)?.data();
    expect(answer).toMatchObject({ cardId: cards[0]?.id, answer: { type: "rating", rating: "good" } });
    expect(answer?.answeredAt.toMillis()).toBe(answeredAt);
    expect((await getDocFromCache(doc(testDb, "card", cards[0]?.id ?? "missing"))).data()).toMatchObject({
      updatedAt: null,
      fsrs: { reps: 1, lastReviewedAt: answeredAt, dueAt: answeredAt + 600_000 },
    });
    // When: Exercise `getCards` with the prepared inputs.
    const savedSchedule = getCards().find((card) => card.id === cards[0]?.id)?.fsrs;
    // Then: Verify the expected result in the assertions below.
    expect(savedSchedule).toBeDefined();
    // When: Exercise `stop` with the prepared inputs.
    stop();
    const subscription = startFirestoreSubscriptions("uid");
    ({ stop } = subscription);
    await subscription.ready;
    // Then: Verify the expected result in the assertions below.
    expect(getCards().find((card) => card.id === cards[0]?.id)?.fsrs).toEqual(savedSchedule);
    await expect(saveStudyAnswer("uid", session, "good", answeredAt)).rejects.toThrow("session does not match");
    // When: Exercise `getStudySession` with the prepared inputs.
    const final = getStudySession(deckId);
    if (!final) throw new Error("Missing final position");
    await saveStudyAnswer("uid", final, "again", answeredAt + 1);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
    expect((await getDocFromCache(doc(testDb, "studySession", session.sessionId))).data()?.endReason).toBe("completed");
    // When: Exercise `enableNetwork` with the prepared inputs.
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    const synced = await getDocsFromCache(collection(testDb, "studyAnswer"));
    // Then: Verify the expected result in the assertions below.
    expect(synced.docs.filter((item) => item.data().sessionId === session.sessionId)).toHaveLength(2);
  });
});
