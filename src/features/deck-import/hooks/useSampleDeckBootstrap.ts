import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { addSampleDeck } from "../model/sampleDeck";
import type { SampleDeckOptions } from "../model/sampleDeck";

type AddSample = () => Promise<unknown>;

const pendingBootstrapsByUid = new Map<string, Promise<unknown>>();

const startSampleDeckBootstrap = (uid: string, addSample: AddSample) => {
  const existing = pendingBootstrapsByUid.get(uid);
  if (existing != null) return existing;

  // Only overlapping effects share work; Deck state remains the source of truth for later bootstrap decisions.
  const operation = Promise.resolve()
    .then(addSample)
    .finally(() => pendingBootstrapsByUid.delete(uid));
  pendingBootstrapsByUid.set(uid, operation);
  return operation;
};

export const useSampleDeckBootstrap = (options: SampleDeckOptions) => {
  const uid = useAuthUid();
  const { cards, createDeck, decks, generateCardId } = options;

  useEffect(() => {
    if (uid === "" || decks.length > 0) return;
    void startSampleDeckBootstrap(uid, () => addSampleDeck(uid, { cards, createDeck, decks, generateCardId })).catch(
      () => undefined
    );
  }, [cards, createDeck, decks, generateCardId, uid]);
};
