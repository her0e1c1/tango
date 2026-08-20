import type { DeckId } from "@/entities/deck";

import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, mutateCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import sampleCards from "../../../../sample/build/output.json";
import { executePreparedDeckImport, prepareDeckImport } from "./useDeckImportExecution";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;

const sampleDeckId = (uid: string): DeckId => `sample-v${String(SAMPLE_VERSION)}-${uid}`;

interface SampleDeckPreparationOptions {
  generateDeckId: () => DeckId;
  generateCardId: () => string;
}

export const prepareSampleDeck = (uid: string, options: SampleDeckPreparationOptions) =>
  prepareDeckImport(
    {
      name: SAMPLE_DECK_NAME,
      rows: sampleCards.map((card, index) => ({ rowNumber: index + 1, card })),
    },
    { uid, ...options }
  );

export const useAddSampleDeck = () => {
  const uid = useAuthUid();
  const decks = useDecks();

  useEffect(() => {
    if (uid === "" || decks.length > 0) return;

    // A stable ID prevents repeated bootstrap effects from creating multiple sample Decks before subscriptions catch up.
    void executePreparedDeckImport(
      prepareSampleDeck(uid, { generateDeckId: () => sampleDeckId(uid), generateCardId }),
      {
        uid,
        createDeck: (deck) => {
          // Samples remain account-synced even when CSV imports support a local destination.
          if (deck.localMode === true) throw new Error("The sample Deck cannot use local storage");
          return createDeck(uid, deck);
        },
        mutateCards: (mutations) => mutateCards(uid, mutations),
      }
    ).catch(() => undefined);
  }, [decks, uid]);
};
