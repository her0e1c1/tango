import type { CardMutation } from "@/entities/card";
import type { DeckId, LocalDeckCreateInput } from "@/entities/deck";

import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import sampleCards from "../../../../../sample/build/output.json";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
const SAMPLE_DECK_ID: DeckId = `sample-v${String(SAMPLE_VERSION)}`;

interface PreparedSampleDeck {
  destination: LocalDeckCreateInput;
  mutations: CardMutation[];
}

const prepareSampleDeck = (): PreparedSampleDeck => ({
  destination: { id: SAMPLE_DECK_ID, name: SAMPLE_DECK_NAME, localMode: true },
  mutations: sampleCards.map((card, index) => ({
    kind: "create",
    card: {
      ...card,
      // Stable IDs make retries and repeated explicit imports converge on the same local Cards.
      id: `${SAMPLE_DECK_ID}-card-${String(index + 1)}`,
      deckId: SAMPLE_DECK_ID,
    },
  })),
});

export const addSampleDeck = async (uid: string) => {
  const sample = prepareSampleDeck();
  await createDeck(uid, sample.destination);
  if (sample.mutations.length > 0) await mutateCards(uid, sample.mutations);
  updatePreferences({ loadSample: false });

  return {
    created: sample.mutations.length,
    deckId: sample.destination.id,
  };
};
