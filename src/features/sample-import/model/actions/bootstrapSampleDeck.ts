import type { Deck } from "@/entities/deck";
import { addSampleDeck } from "./addSampleDeck";

export const bootstrapSampleDeck = async (uid: string, decks: Deck[], loadSample: boolean): Promise<void> => {
  if (!loadSample || decks.length > 0) return;
  // Bootstrap is opportunistic and must not block the Deck list when local persistence fails.
  await addSampleDeck(uid).catch(() => undefined);
};
