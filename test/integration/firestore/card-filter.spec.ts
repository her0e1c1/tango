import { testDb } from "@/test/initializeTestFirestore";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps, initializeApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  getFirestore,
  setDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
} from "firebase/firestore";
import { clearRemoteDecks, createDeck, editDeck, getCardFilter, getDecks, subscribeDecks } from "@/entities/deck";
import type { CardFilter } from "@/entities/deck";
import { createCard } from "@/test/factories";

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
}));

const empty: CardFilter = { selectedTags: [], tagAndFilter: false };
const original: CardFilter = { selectedTags: ["tag-a", "tag-b"], tagAndFilter: true };
const replacement: CardFilter = { selectedTags: ["tag-b", "tag-c"], tagAndFilter: false };
const uid = "uid";
const errors: Error[] = [];
let stop: (() => void) | undefined;

function start() {
  stop = subscribeDecks(uid, (error) => errors.push(error));
}

function filter(id: string) {
  const deck = getDecks().find((candidate) => candidate.id === id);
  if (deck === undefined) throw new Error("Deck subscription has not arrived");
  return getCardFilter(deck);
}

async function saved(id: string) {
  await waitForPendingWrites(testDb);
  return (await getDocFromServer(doc(testDb, "deck", id))).data();
}

async function seed(cardFilter?: CardFilter) {
  const id = crypto.randomUUID();
  await createDeck(uid, {
    id,
    name: "Browse deck",
    url: "https://example.com/deck",
    selectedTags: ["study-a"],
    tagAndFilter: true,
    ...(cardFilter === undefined ? {} : { cardFilter }),
  });
  await saved(id);
  await vi.waitFor(() => {
    if (JSON.stringify(filter(id)) !== JSON.stringify(cardFilter ?? empty))
      throw new Error("Filter has not synchronized");
  });
  return id;
}

async function restore(expected: [string, CardFilter][]) {
  stop?.();
  clearRemoteDecks();
  start();
  await vi.waitFor(() => {
    for (const [id, value] of expected) {
      if (JSON.stringify(filter(id)) !== JSON.stringify(value)) throw new Error("Filter has not restored");
    }
  });
}

async function relatedDocuments(deckId: string) {
  const card = createCard({ id: crypto.randomUUID(), deckId, uid });
  const references = [
    doc(testDb, "card", card.id),
    doc(testDb, "studyAnswer", crypto.randomUUID()),
    doc(testDb, "studySession", crypto.randomUUID()),
  ] as const;
  await setDoc(references[0], { ...card, deletedAt: null, updatedAt: serverTimestamp() });
  await setDoc(references[1], {
    uid,
    deckId,
    cardId: card.id,
    rating: "good",
    answeredAt: 123,
    updatedAt: serverTimestamp(),
  });
  await setDoc(references[2], { uid, deckId, cardOrderIds: [card.id], currentIndex: 0, updatedAt: serverTimestamp() });
  const read = () => Promise.all(references.map(async (reference) => (await getDocFromServer(reference)).data()));
  return { read, before: await read() };
}

describe("Card filter persistence", () => {
  beforeEach(() => {
    clearRemoteDecks();
    errors.length = 0;
    start();
  });
  afterEach(() => {
    stop?.();
    if (errors.length > 0) throw new AggregateError(errors, "Deck subscription failed");
  });
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  it.each([false, true])("[FIRESTORE-CARD-FILTER-01] defaults independently with cards: %s", async (withCards) => {
    const id = await seed();
    const other = await seed({ selectedTags: ["tag-other"], tagAndFilter: true });
    if (withCards) await relatedDocuments(id);
    const before = await saved(id);
    await restore([
      [id, empty],
      [other, { selectedTags: ["tag-other"], tagAndFilter: true }],
    ]);
    expect(await saved(id)).toEqual(before);
    expect(await saved(id)).not.toHaveProperty("cardFilter");
  });

  it.each([
    { selectedTags: ["tag-a"], tagAndFilter: false },
    original,
    { selectedTags: ["tag-a", "tag-b"], tagAndFilter: false },
  ])("[FIRESTORE-CARD-FILTER-02] saves and restores $selectedTags / $tagAndFilter", async (value) => {
    const id = await seed();
    const before = await saved(id);
    await editDeck(uid, { id, cardFilter: value });
    expect(await saved(id)).toEqual({ ...before, cardFilter: value, updatedAt: expect.any(Timestamp) });
    await restore([[id, value]]);
  });

  it("[FIRESTORE-CARD-FILTER-03] replaces selections without changing study data", async () => {
    const id = await seed(original);
    const related = await relatedDocuments(id);
    const before = await saved(id);
    await editDeck(uid, { id, cardFilter: replacement });
    expect(await saved(id)).toEqual({ ...before, cardFilter: replacement, updatedAt: expect.any(Timestamp) });
    await restore([[id, replacement]]);
    expect(await related.read()).toEqual(related.before);
  });

  it("[FIRESTORE-CARD-FILTER-04] persists cleared filters without changing study data", async () => {
    const id = await seed(original);
    const related = await relatedDocuments(id);
    const before = await saved(id);
    await editDeck(uid, { id, cardFilter: empty });
    expect(await saved(id)).toEqual({ ...before, cardFilter: empty, updatedAt: expect.any(Timestamp) });
    await restore([[id, empty]]);
    expect(await related.read()).toEqual(related.before);
  });

  it.each([{ selectedTags: ["tag-c"], tagAndFilter: false }, empty])(
    "[FIRESTORE-CARD-FILTER-05] isolates Deck changes: $selectedTags",
    async (value) => {
      const a = await seed({ selectedTags: ["tag-a"], tagAndFilter: true });
      const bFilter = { selectedTags: ["tag-b"], tagAndFilter: false };
      const b = await seed(bFilter);
      const c = await seed();
      const unchanged = await Promise.all([saved(b), saved(c)]);
      await editDeck(uid, { id: a, cardFilter: value });
      expect((await saved(a))?.cardFilter).toEqual(value);
      await restore([
        [a, value],
        [b, bFilter],
        [c, empty],
      ]);
      expect(await Promise.all([saved(b), saved(c)])).toEqual(unchanged);
    }
  );

  it("[FIRESTORE-CARD-FILTER-06] keeps browsing filters when study tags change", async () => {
    const browse = { selectedTags: ["browse-a", "browse-b"], tagAndFilter: true };
    const id = await seed(browse);
    await editDeck(uid, { id, selectedTags: ["study-b"], tagAndFilter: false });
    expect(await saved(id)).toMatchObject({ cardFilter: browse, selectedTags: ["study-b"], tagAndFilter: false });
    await restore([[id, browse]]);
  });

  it.each([{ selectedTags: ["tag-c", "tag-d"], tagAndFilter: true }, empty])(
    "[FIRESTORE-CARD-FILTER-07] receives independent connection updates: $selectedTags",
    async (value) => {
      const a = await seed({ selectedTags: ["tag-a"], tagAndFilter: false });
      const bFilter = { selectedTags: ["tag-b"], tagAndFilter: true };
      const b = await seed(bFilter);
      const before = await saved(b);
      const app = initializeApp({ projectId: "test" }, crypto.randomUUID());
      const writer = getFirestore(app);
      connectFirestoreEmulator(writer, import.meta.env.VITE_DB_HOST, Number(import.meta.env.VITE_DB_PORT), {
        mockUserToken: { user_id: uid, firebase: { sign_in_provider: "google.com", identities: {} } },
      });
      try {
        await updateDoc(doc(writer, "deck", a), { cardFilter: value, updatedAt: serverTimestamp() });
        await waitForPendingWrites(writer);
        expect((await getDocFromServer(doc(writer, "deck", a))).data()?.cardFilter).toEqual(value);
        await vi.waitFor(() => expect(filter(a)).toEqual(value));
        expect(filter(b)).toEqual(bFilter);
        expect(await saved(b)).toEqual(before);
      } finally {
        await deleteApp(app);
      }
    }
  );
});
