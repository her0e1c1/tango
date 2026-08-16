import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { addSampleDeck } from "../model/sampleDeck";

const bootstrappingUids = new Set<string>();

const startSampleDeckBootstrap = async (uid: string, addSample: () => Promise<unknown>) => {
  if (bootstrappingUids.has(uid)) return;

  // Only overlapping effects share work; Deck state remains the source of truth for later bootstrap decisions.
  bootstrappingUids.add(uid);
  try {
    await addSample();
  } finally {
    bootstrappingUids.delete(uid);
  }
};

export const useSampleDeckBootstrap = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();

  useEffect(() => {
    if (uid === "" || decks.length > 0) return;
    void startSampleDeckBootstrap(uid, () => addSampleDeck(uid, { cards, createDeck, decks, generateCardId })).catch(
      () => undefined
    );
  }, [cards, decks, uid]);
};
