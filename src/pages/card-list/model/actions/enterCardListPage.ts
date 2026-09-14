import { cardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export function enterCardListPage(): () => void {
  // Distinguish every visit, including reopening the same Deck and Strict Mode effect replays.
  const owner = Symbol("card-list-visit");
  dismissListError();
  cardListStore.setState({ ...cardListStore.getInitialState(), owner });
  return () => {
    if (cardListStore.getState().owner !== owner) return;
    dismissListError();
    cardListStore.setState(cardListStore.getInitialState());
  };
}
