import type { Card } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { mutateCards } from "@/entities/card";
import sampleCards from "../../../../sample/build/output.json";
import { executePreparedDeckImport, prepareDeckImport } from "./deckImportExecution";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;

const sampleDeckId = (uid: string): DeckId => `sample-v${SAMPLE_VERSION}-${uid}`;

export interface SampleDeckOptions {
  cards: Card[];
  createDeck: (uid: string, deck: DeckCreateInput) => Promise<unknown>;
  decks: Deck[];
  generateCardId: () => string;
}

export const prepareSampleDeck = (uid: string, options: Omit<SampleDeckOptions, "createDeck">) =>
  prepareDeckImport(
    {
      name: SAMPLE_DECK_NAME,
      preferredDeckId: sampleDeckId(uid),
      rows: sampleCards.map((card, index) => ({ rowNumber: index + 1, card })),
    },
    { uid, ...options }
  );

export const addSampleDeck = (uid: string, options: SampleDeckOptions) => {
  if (uid === "" || options.decks.length > 0) return Promise.resolve();

  return executePreparedDeckImport(prepareSampleDeck(uid, options), {
    uid,
    createDeck: (deck) => {
      // Samples remain account-synced even when CSV imports support a local destination.
      if (deck.localMode === true) throw new Error("The sample Deck cannot use local storage");
      return options.createDeck(uid, deck);
    },
    mutateCards: (mutations) => mutateCards(uid, mutations),
  });
};
