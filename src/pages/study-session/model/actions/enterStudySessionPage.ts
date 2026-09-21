import type { DeckId } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { studySessionPageStore } from "../store";

export function enterStudySessionPage(uid: string, deckId: DeckId): () => void {
  // Object identity distinguishes repeated visits to the same Deck and Strict Mode effect replays.
  const owner = { uid, deckId };
  studySessionPageStore.setState({
    owner,
    pageState: {
      ...studySessionPageStore.getInitialState().pageState,
      autoPlay: getPreferences().study.defaultAutoPlay,
    },
  });
  return () => {
    if (studySessionPageStore.getState().owner !== owner) return;
    studySessionPageStore.setState({ owner: undefined });
  };
}
