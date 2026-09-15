import { cardListStore } from "../store";

export function enterCardListPage(): () => void {
  // Distinguish every visit, including reopening the same Deck and Strict Mode effect replays.
  const owner = Symbol("card-list-visit");
  cardListStore.setState({ ...cardListStore.getInitialState(), owner });
  return () => {
    if (cardListStore.getState().owner !== owner) return;
    cardListStore.setState(cardListStore.getInitialState());
  };
}
