import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { addSampleDeck } from "../model/sampleDeck";

export const useSampleDeckBootstrap = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();

  useEffect(() => {
    if (uid === "" || decks.length > 0) return;
    void addSampleDeck(uid, { cards, createDeck, decks, generateCardId }).catch(() => undefined);
  }, [cards, decks, uid]);
};
