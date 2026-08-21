import type { DeckId } from "@/entities/deck";

import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, mutateCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { updatePreferences, usePreferences } from "@/entities/preferences";
import sampleCards from "../../../../sample/build/output.json";
import { executePreparedDeckImport, prepareDeckImport } from "./useDeckImportExecution";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
const SAMPLE_DECK_ID: DeckId = `sample-v${String(SAMPLE_VERSION)}`;

let pendingSampleDeckImport: Promise<unknown> | undefined;

interface SampleDeckPreparationOptions {
  generateCardId: () => string;
}

export const prepareSampleDeck = (uid: string, options: SampleDeckPreparationOptions) =>
  prepareDeckImport(
    {
      name: SAMPLE_DECK_NAME,
      rows: sampleCards.map((card, index) => ({ rowNumber: index + 1, card })),
      storageMode: "local",
    },
    { uid, generateDeckId: () => SAMPLE_DECK_ID, ...options }
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
  const decks = useDecks();
  const { loadSample } = usePreferences();

  useEffect(() => {
    if (!loadSample || decks.length > 0) return;

    // Bootstrap is opportunistic and must not block the Deck list when local persistence fails.
    void startSampleDeckImport(() =>
      executePreparedDeckImport(prepareSampleDeck(uid, { generateCardId }), {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      })
    ).catch(() => undefined);
  }, [decks, loadSample, uid]);
};
