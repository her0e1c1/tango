import type { Card, CardRaw } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { mutateCards } from "@/entities/card";
import sampleCards from "../../../../sample/build/output.json";
import { executePreparedDeckImport, prepareDeckImport } from "./deckImportExecution";
import type { DeckImportRow } from "./deckImportTypes";

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;

const sampleDeckId = (uid: string): DeckId => `sample-v${SAMPLE_VERSION}-${uid}`;
const rowsFromCards = (cards: CardRaw[]): DeckImportRow[] =>
  cards.map((card, index) => ({ rowNumber: index + 1, card }));

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
      rows: rowsFromCards(sampleCards),
    },
    { uid, ...options }
  );

export const addSampleDeck = (uid: string, options: SampleDeckOptions) =>
  executePreparedDeckImport(prepareSampleDeck(uid, options), {
    uid,
    createDeck: (deck) => options.createDeck(uid, deck),
    mutateCards: (mutations) => mutateCards(uid, mutations),
  });
