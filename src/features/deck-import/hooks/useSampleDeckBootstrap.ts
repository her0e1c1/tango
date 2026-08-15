import { useEffect } from "react";

import { useAuthUid } from "@/entities/auth";
import { addSampleDeck } from "../model/sampleDeck";
import type { SampleDeckOptions } from "../model/sampleDeck";

type AddSample = () => Promise<unknown>;

const bootstrapsByUid = new Map<string, Promise<unknown>>();

const startSampleDeckBootstrap = (uid: string, addSample: AddSample) => {
  const existing = bootstrapsByUid.get(uid);
  if (existing != null) return existing;

  const operation = Promise.resolve().then(addSample);
  bootstrapsByUid.set(uid, operation);
  // Successful operations stay cached across StrictMode remounts; failures are removed so a later render can retry.
  void operation.catch(() => {
    bootstrapsByUid.delete(uid);
  });
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
