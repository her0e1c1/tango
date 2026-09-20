import { getDecks } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { addSampleDeck } from "./addSampleDeck";

export async function bootstrapSampleDeck(): Promise<void> {
  if (!getPreferences().loadSample || getDecks().length > 0) return;
  // Bootstrap is opportunistic and must not block the Deck list when local persistence fails.
  await addSampleDeck().catch(() => undefined);
}
