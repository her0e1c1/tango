import type { DeckId } from "@/entities/deck";

import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { mutateCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { updatePreferences, usePreferences } from "@/entities/preference";
import sampleCards from "../../../../sample/build/output.json";
import { executePreparedDeckImport, prepareDeckImport } from "./useDeckImportExecution";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
const SAMPLE_DECK_ID: DeckId = `sample-v${String(SAMPLE_VERSION)}`;

export const prepareSampleDeck = (uid: string) =>
  prepareDeckImport(
    {
      name: SAMPLE_DECK_NAME,
      rows: sampleCards.map((card, index) => ({ rowNumber: index + 1, card })),
      storageMode: "local",
    },
    {
      uid,
      generateDeckId: () => SAMPLE_DECK_ID,
      // Stable IDs make automatic retries and repeated explicit imports converge on the same local Cards.
      generateCardId: ({ rowNumber }) => `${SAMPLE_DECK_ID}-card-${String(rowNumber)}`,
    }
  );

export const useAddSampleDeck = () => {
  const uid = useAuthUid();
  const decks = useDecks();
  const { loadSample } = usePreferences();

  useEffect(() => {
    if (!loadSample || decks.length > 0) return;

    // Bootstrap is opportunistic and must not block the Deck list when local persistence fails.
    void executePreparedDeckImport(prepareSampleDeck(uid), {
      uid,
      createDeck: (deck) => createDeck(uid, deck),
      mutateCards: (mutations) => mutateCards(uid, mutations),
    })
      .then(() => updatePreferences({ loadSample: false }))
      .catch(() => undefined);
  }, [decks, loadSample, uid]);
};
