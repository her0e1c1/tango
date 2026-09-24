import { writeCardCreate, type CardMutation } from "@/entities/card";
import type { DeckId, RemoteDeckCreateInput } from "@/entities/deck";

import { getAuthUid } from "@/entities/auth";
import { writeDeckCreate } from "@/entities/deck";
import { writeBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import sampleCards from "../../../../../sample/build/output.json";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;

interface PreparedSampleDeck {
  destination: RemoteDeckCreateInput;
  mutations: CardMutation[];
}

const prepareSampleDeck = (uid: string): PreparedSampleDeck => {
  const SampleDeckId: DeckId = `${uid}-sample-v${String(SAMPLE_VERSION)}`;
  return {
    destination: { id: SampleDeckId, name: SAMPLE_DECK_NAME },
    mutations: sampleCards.map((card, index) => ({
      kind: "create",
      card: {
        ...card,
        // Stable IDs make concurrent bootstrap attempts converge on the same local Cards.
        id: `${SampleDeckId}-card-${String(index + 1)}`,
        deckId: SampleDeckId,
      },
    })),
  };
};

export async function addSampleDeck() {
  // Read the current identity when the action runs rather than capturing a caller snapshot.
  const uid = getAuthUid();
  const sample = prepareSampleDeck(uid);
  const batch = writeBatch(db);
  writeDeckCreate(batch, uid, sample.destination);
  for (const mutation of sample.mutations) {
    if (mutation.kind !== "create") throw new Error("Sample Deck only supports Card creation");
    writeCardCreate(batch, uid, mutation.card);
  }
  void batch.commit().catch(() => undefined);

  return {
    created: sample.mutations.length,
    deckId: sample.destination.id,
  };
}
