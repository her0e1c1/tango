import type { Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";

import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, mutateCards, useCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { updatePreferences, usePreferences } from "@/entities/preferences";
import sampleCards from "../../../../sample/build/output.json";
import { executePreparedDeckImport, prepareDeckImport } from "./useDeckImportExecution";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
const SAMPLE_DECK_ID: DeckId = `sample-v${String(SAMPLE_VERSION)}`;

let pendingSampleDeckImport: Promise<unknown> | undefined;

interface SampleDeckPreparationOptions {
  cards: Card[];
  decks: Deck[];
  generateCardId: () => string;
}

export const prepareSampleDeck = (uid: string, options: SampleDeckPreparationOptions) =>
  prepareDeckImport(
    {
      name: SAMPLE_DECK_NAME,
      preferredDeckId: SAMPLE_DECK_ID,
      rows: sampleCards.map((card, index) => ({ rowNumber: index + 1, card })),
      storageMode: "local",
    },
    { uid, ...options }
  );

const startSampleDeckImport = (importSample: () => Promise<unknown>): Promise<unknown> => {
  if (pendingSampleDeckImport != null) return pendingSampleDeckImport;

  // StrictMode and rapid remounts can overlap effects; share the operation until its durable preference is disabled.
  const operation = importSample()
    .then((result) => {
      updatePreferences({ loadSample: false });
      return result;
    })
    .finally(() => {
      if (pendingSampleDeckImport === operation) pendingSampleDeckImport = undefined;
    });
  pendingSampleDeckImport = operation;
  return operation;
};

export const useAddSampleDeck = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const { loadSample } = usePreferences();

  useEffect(() => {
    if (!loadSample || decks.length > 0) return;

    // Bootstrap is opportunistic and must not block the Deck list when local persistence fails.
    void startSampleDeckImport(() =>
      executePreparedDeckImport(prepareSampleDeck(uid, { cards, decks, generateCardId }), {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      })
    ).catch(() => undefined);
  }, [cards, decks, loadSample, uid]);
};
