import { deckEditPageStore } from "../store";

export function enterDeckEditPage(): () => void {
  // Distinguish every visit, including reopening the same Deck and Strict Mode effect replays.
  const owner = Symbol("deck-edit-visit");
  deckEditPageStore.setState({ ...deckEditPageStore.getInitialState(), owner });

  return () => {
    if (deckEditPageStore.getState().owner !== owner) return;
    deckEditPageStore.setState(deckEditPageStore.getInitialState());
  };
}
