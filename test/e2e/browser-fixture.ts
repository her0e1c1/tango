import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
/** Test-only build entry sharing the app's SDK instance; never included in a normal release build. */
import {
  collection,
  doc,
  getDocsFromCache,
  query,
  Timestamp,
  waitForPendingWrites,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/shared/firebase";
import { writeLocally } from "@/shared/firestore-write";

interface Seed {
  decks?: Record<string, unknown>[];
  cards?: Record<string, unknown>[];
  sessionsByDeckId?: Record<
    string,
    { sessionId: string; deckId: string; cardOrderIds: string[]; currentIndex: number; lastStudiedAt: number }
  >;
}

export async function seedCache(seed: Seed): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Authenticate before seeding the cache");
  const documents = [
    ...(seed.decks ?? []).map(({ localMode: _mode, ...deck }) => ({
      collection: "deck",
      id: String(deck.id),
      data: { ...deck, uid, deletedAt: null },
    })),
    ...(seed.cards ?? []).map((card) => ({ collection: "card", id: String(card.id), data: { ...card, uid } })),
    ...Object.values(seed.sessionsByDeckId ?? {}).map((session) => ({
      collection: "studySession",
      id: session.sessionId,
      data: {
        uid,
        deckId: session.deckId,
        cardOrderIds: session.cardOrderIds,
        currentIndex: session.currentIndex,
        startedAt: Timestamp.fromMillis(session.lastStudiedAt),
        createdAt: Timestamp.fromMillis(session.lastStudiedAt),
        updatedAt: Timestamp.fromMillis(session.lastStudiedAt),
        endedAt: null,
        endReason: null,
      },
    })),
  ];
  for (let index = 0; index < documents.length; index += 20) {
    const batch = writeBatch(db);
    const references = documents.slice(index, index + 20).map((item) => {
      const reference = doc(db, item.collection, item.id);
      batch.set(reference, item.data);
      return reference;
    });
    await writeLocally(uid, references, () => batch.commit());
  }
}

export async function readCache() {
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  const snapshots = await Promise.all(
    ["deck", "card", "studySession"].map((name) =>
      getDocsFromCache(query(collection(db, name), where("uid", "==", uid ?? "")))
    )
  );
  const decks =
    snapshots[0]?.docs
      .filter((document) => document.data().deletedAt === null)
      .map((document) => ({ ...document.data(), id: document.id }) as Deck) ?? [];
  const ids = new Set(decks.map((deck) => deck.id));
  const cards =
    snapshots[1]?.docs
      .filter((document) => document.data().deletedAt === null && ids.has(String(document.data().deckId)))
      .map((document) => ({ ...document.data(), id: document.id }) as Card) ?? [];
  const sessionsByDeckId: Record<string, unknown> = {};
  for (const document of snapshots[2]?.docs ?? []) {
    const data = document.data();
    if (data.endReason !== null || !ids.has(String(data.deckId))) continue;
    sessionsByDeckId[String(data.deckId)] = {
      sessionId: document.id,
      deckId: data.deckId,
      cardOrderIds: data.cardOrderIds,
      currentIndex: data.currentIndex,
      lastStudiedAt: (data.updatedAt as Timestamp).toMillis(),
    };
  }
  return { decks, cards, sessionsByDeckId };
}

export async function waitForCacheSync(): Promise<void> {
  await waitForPendingWrites(db);
}
