import type { CardMutation } from "@/entities/card";
import type { DeckId, LocalDeckCreateInput } from "@/entities/deck";

import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { mutateCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { updatePreferences, usePreferences } from "@/entities/preference";
import sampleCards from "../../../sample/build/output.json";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
const SAMPLE_DECK_ID: DeckId = `sample-v${String(SAMPLE_VERSION)}`;

export interface PreparedSampleDeck {
  uid: string;
  destination: LocalDeckCreateInput;
  mutations: CardMutation[];
}

export const prepareSampleDeck = (uid: string): PreparedSampleDeck => ({
  uid,
  destination: { id: SAMPLE_DECK_ID, name: SAMPLE_DECK_NAME, localMode: true },
  mutations: sampleCards.map((card, index) => ({
    kind: "create",
    card: {
      ...card,
      id: `${SAMPLE_DECK_ID}-card-${String(index + 1)}`,
      deckId: SAMPLE_DECK_ID,
    },
  })),
});

const addSampleDeck = async (uid: string) => {
  const sample = prepareSampleDeck(uid);
  await createDeck(uid, sample.destination);
  if (sample.mutations.length > 0) await mutateCards(uid, sample.mutations);
};

export const useAddSampleDeck = () => {
  const uid = useAuthUid();
  const decks = useDecks();
  const { loadSample } = usePreferences();

  useEffect(() => {
    if (!loadSample || decks.length > 0) return;

    // Bootstrap is opportunistic and must not block the Deck list when local persistence fails.
    void addSampleDeck(uid)
      .then(() => updatePreferences({ loadSample: false }))
      .catch(() => undefined);
  }, [decks, loadSample, uid]);
};
