import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { addSampleDeck } from "../model/sampleDeck";

export const useAddSampleDeck = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();

  useEffect(() => {
    // Bootstrap is opportunistic; subscription changes provide another attempt without blocking the Deck list.
    void addSampleDeck(uid, { cards, createDeck, decks, generateCardId }).catch(() => undefined);
  }, [cards, decks, uid]);
};
