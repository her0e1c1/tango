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
import { saveStudyAnswer } from "@/pages/study-session/api/saveStudyAnswer";
import { startFirestoreSubscriptions } from "@/app/firestore-subscriptions";
import { migrateLegacyData } from "@/app/auth/migrateLegacyData";
import { createCard as cardFixture, createDeck as deckFixture } from "@/test/factories";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
}));

let stop: () => void = () => undefined;
let deckId: string;
beforeEach(async () => {
  await disableNetwork(testDb);
  replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: true, displayName: null });
  const subscription = startFirestoreSubscriptions("uid");
  stop = subscription.stop;
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

describe("Firestore cache mutations [CARD-04 PERSIST-02 PERSIST-04 SWIPE-10]", () => {
  it("completes offline Card writes and hides every child after deleting its Deck", async () => {
    await createDeck("uid", { id: deckId, name: "Offline" });
    await vi.waitFor(() => expect(getDecks().some((deck) => deck.id === deckId)).toBe(true));
    const first = cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" });
    const second = cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid" });
    await createCard("uid", first);
    await createCard("uid", second);
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toHaveLength(2));
    await editCard("uid", { id: first.id, frontText: "Edited offline" });
    expect((await getDocFromCache(doc(testDb, "card", first.id))).data()?.frontText).toBe("Edited offline");
    await deleteCard("uid", first.id);
    await vi.waitFor(() => expect(getCards().some((card) => card.id === first.id)).toBe(false));
    await deleteDeck("uid", deckId);
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toEqual([]));
  });

  it("saves one answer, progress and session advancement atomically while offline", async () => {
    await createDeck("uid", { id: deckId, name: "Study offline" });
    const cards = [0, 1].map(() => cardFixture({ id: crypto.randomUUID(), deckId, uid: "uid", numberOfSeen: 0 }));
    await vi.waitFor(() => expect(getDecks().some((deck) => deck.id === deckId)).toBe(true));
    for (const card of cards) await createCard("uid", card);
    await vi.waitFor(() => expect(getCards().filter((card) => card.deckId === deckId)).toHaveLength(2));
    await startStudy(deckId, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, "uid");
    const session = getStudySession(deckId);
    if (!session) throw new Error("Missing session");
    const answeredAt = 1_800_000_000_000;
    await saveStudyAnswer("uid", session, "GoToNextCardMastered", answeredAt);
    const answers = await getDocsFromCache(collection(testDb, "studyAnswer"));
    const answer = answers.docs.find((item) => item.data().sessionId === session.sessionId)?.data();
    expect(answer).toMatchObject({ cardId: cards[0]?.id, answer: { type: "rating", rating: "good" } });
    expect(answer?.answeredAt.toMillis()).toBe(answeredAt);
    expect((await getDocFromCache(doc(testDb, "card", cards[0]?.id ?? "missing"))).data()).toMatchObject({
      numberOfSeen: 1,
      lastSeenAt: answeredAt,
    });
    await vi.waitFor(() => expect(getStudySession(deckId)?.currentIndex).toBe(1));
    await expect(saveStudyAnswer("uid", session, "GoToNextCardMastered", answeredAt)).rejects.toThrow(
      "position or owner"
    );
    const final = getStudySession(deckId);
    if (!final) throw new Error("Missing final position");
    await saveStudyAnswer("uid", final, "GoToNextCardNotMastered", answeredAt + 1);
    await vi.waitFor(() => expect(getStudySession(deckId)).toBeUndefined());
    expect((await getDocFromCache(doc(testDb, "studySession", session.sessionId))).data()?.endReason).toBe("completed");
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    const synced = await getDocsFromCache(collection(testDb, "studyAnswer"));
    expect(synced.docs.filter((item) => item.data().sessionId === session.sessionId)).toHaveLength(2);
  });

  it("imports legacy data once and preserves its original backup", async () => {
    const deck = deckFixture({ id: deckId });
    const card = cardFixture({ id: crypto.randomUUID(), deckId });
    const original = JSON.stringify({ version: 0, state: { localDecks: [deck] } });
    localStorage.setItem("tango-local-decks", original);
    localStorage.setItem("tango-local-cards", JSON.stringify({ version: 0, state: { localCards: [card] } }));
    await migrateLegacyData("uid");
    await migrateLegacyData("another-user");
    expect(localStorage.getItem("tango-local-decks")).toBe(original);
    expect((await getDocFromCache(doc(testDb, "deck", `uid-legacy-${deckId}`))).data()?.uid).toBe("uid");
    expect(localStorage.getItem("tango-firestore-migrated")).toBe("uid");
  });
});
