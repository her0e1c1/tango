import type { Card } from "../model/card";
import type { RemoteSnapshot } from "@/shared/api";

import "@/test/firestore/initializeTestFirestore";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import * as UUID from "uuid";

import { createCard } from "@/test/factories";
import { create, remove, update } from "./firestore";
import { subscribeCardReads } from "./subscribeCardReads";

vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getTimestamp: vi.fn(() => 100),
}));

const deckDocument = {
  name: "Deck",
  isPublic: false,
  uid: "uid",
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
  selectedTags: [],
  tagAndFilter: false,
  category: "",
  convertToBr: false,
};

describe("Card Firestore subscription", () => {
  const db = getFirestore();

  it("delivers initial, update, and delete snapshots", async () => {
    const snapshots: RemoteSnapshot<Card>[] = [];
    const errors: Error[] = [];
    const deckId = UUID.v4();
    const card = createCard({ id: UUID.v4(), deckId, uid: "uid" });
    await setDoc(doc(db, "deck", deckId), deckDocument);
    const stop = subscribeCardReads({
      uid: "uid",
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onError: (error) => errors.push(error),
    });

    try {
      await vi.waitFor(() => expect(snapshots[0]).toMatchObject({ type: "replace" }), { timeout: 5_000 });

      await create(card);
      await vi.waitFor(
        () => {
          expect(
            snapshots.some(
              (snapshot) => snapshot.type === "change" && snapshot.event.added.some((item) => item.id === card.id)
            )
          ).toBe(true);
        },
        { timeout: 5_000 }
      );

      await update({ ...card, frontText: "Updated" });
      await vi.waitFor(
        () => {
          expect(
            snapshots.some(
              (snapshot) => snapshot.type === "change" && snapshot.event.modified[0]?.frontText === "Updated"
            )
          ).toBe(true);
        },
        { timeout: 5_000 }
      );

      await remove(card.id);
      await vi.waitFor(
        () => {
          expect(
            snapshots.some((snapshot) => snapshot.type === "change" && snapshot.event.removed.includes(card.id))
          ).toBe(true);
        },
        { timeout: 5_000 }
      );
      expect(errors).toEqual([]);
    } finally {
      stop();
    }
  }, 20_000);
});
