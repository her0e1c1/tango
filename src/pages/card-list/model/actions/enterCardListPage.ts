import { cardListStore } from "../store";

export function enterCardListPage(): () => void {
  cardListStore.setState(cardListStore.getInitialState());
  return () => {
    cardListStore.setState(cardListStore.getInitialState());
  };
}
