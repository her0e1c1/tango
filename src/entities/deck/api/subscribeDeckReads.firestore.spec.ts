import type { Deck } from "../model/deck";
import type { RemoteSnapshot } from "@/shared/api";

import "@/test/firestore/initializeTestFirestore";
import { deleteDoc, doc, getFirestore } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import * as UUID from "uuid";

import { createDeck } from "@/test/factories";
import { create, update } from "./firestore";
import { subscribeDeckReads } from "./subscribeDeckReads";

vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getTimestamp: vi.fn(() => 100),
}));

describe("Deck Firestore subscription", () => {
  const db = getFirestore();

  it("delivers initial, update, and delete snapshots", async () => {
    const snapshots: RemoteSnapshot<Deck>[] = [];
    const errors: Error[] = [];
    const deck = createDeck({ id: UUID.v4(), uid: "uid" });
    const stop = subscribeDeckReads({
      uid: "uid",
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onError: (error) => errors.push(error),
    });

    try {
      await vi.waitFor(() => expect(snapshots[0]).toMatchObject({ type: "replace" }), { timeout: 5_000 });

      await create(deck);
      await vi.waitFor(
        () => {
          expect(
            snapshots.some(
              (snapshot) => snapshot.type === "change" && snapshot.event.added.some((item) => item.id === deck.id)
            )
          ).toBe(true);
        },
        { timeout: 5_000 }
      );

      await update({ ...deck, name: "Updated" });
      await vi.waitFor(
        () => {
          expect(
            snapshots.some((snapshot) => snapshot.type === "change" && snapshot.event.modified[0]?.name === "Updated")
          ).toBe(true);
        },
        { timeout: 5_000 }
      );

      await deleteDoc(doc(db, "deck", deck.id));
      await vi.waitFor(
        () => {
          expect(
            snapshots.some((snapshot) => snapshot.type === "change" && snapshot.event.removed.includes(deck.id))
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
