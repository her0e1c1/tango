import { deckFormPageStore } from "../store";

export function enterDeckFormPage(): () => void {
  // Distinguish every visit, including reopening the same Deck and Strict Mode effect replays.
  const owner = Symbol("deck-form-visit");
  deckFormPageStore.setState({ ...deckFormPageStore.getInitialState(), owner });

  return () => {
    if (deckFormPageStore.getState().owner !== owner) return;
    deckFormPageStore.setState(deckFormPageStore.getInitialState());
  };
}
