import "@/test/firestore/initializeTestFirestore";
import { describe, expect, it } from "vitest";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import * as UUID from "uuid";

import { remove } from "./deck";

describe("legacy Deck deletion", () => {
  const db = getFirestore();

  it("deletes a Deck after deleting its child Cards", async () => {
    const deckId = UUID.v4();
    const deckRef = doc(db, "deck", deckId);
    await setDoc(deckRef, { uid: "uid" });

    await remove(deckId, "uid");

    await expect(getDoc(deckRef)).rejects.toMatchObject({ code: "permission-denied" });
  });
});
