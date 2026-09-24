import { showToast } from "@/shared/ui/toast";
import { getDecks } from "@/entities/deck";
import { getPreferences, updatePreferences } from "@/entities/preference";
import { getAuthUid } from "@/entities/auth";
import { deckListStore } from "../store";
import { addSampleDeck } from "./addSampleDeck";

export async function bootstrapSampleDeck(): Promise<void> {
  const uid = getAuthUid();
  const onLocalError = () => {
    if (getAuthUid() === uid) showToast({ messageKey: "toast.saveFailure", tone: "error" });
  };
  const sampleDeckId = `${uid}-sample-v1`;
  const decks = getDecks();
  if (decks.some((deck) => deck.id === sampleDeckId)) {
    updatePreferences({ loadSample: false });
    deckListStore.setState({ bootstrapStatus: "done" });
    return;
  }
  if (!getPreferences().loadSample || decks.length > 0) {
    deckListStore.setState({ bootstrapStatus: "done" });
    return;
  }
  if (deckListStore.getState().bootstrapStatus === "checking") return;
  deckListStore.setState({ bootstrapStatus: "checking" });
  try {
    await addSampleDeck(onLocalError);
    if (getAuthUid() !== uid) return;
    if (getDecks().some((deck) => deck.id === sampleDeckId)) {
      updatePreferences({ loadSample: false });
      deckListStore.setState({ bootstrapStatus: "done" });
    }
  } catch {
    if (getAuthUid() !== uid) return;
    showToast({ messageKey: "toast.saveFailure", tone: "error" });
    deckListStore.setState({ bootstrapStatus: "error" });
  }
}
