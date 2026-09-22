import { getDecks } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { deckListStore } from "../store";
import { addSampleDeck } from "./addSampleDeck";

export async function bootstrapSampleDeck(): Promise<void> {
  if (deckListStore.getState().bootstrapStatus === "checking") return;
  if (!getPreferences().loadSample || getDecks().length > 0) {
    deckListStore.setState({ bootstrapStatus: "done" });
    return;
  }
  deckListStore.setState({ bootstrapStatus: "checking" });
  try {
    await addSampleDeck();
    deckListStore.setState({ bootstrapStatus: "done" });
  } catch {
    deckListStore.setState({ bootstrapStatus: "error" });
  }
}
