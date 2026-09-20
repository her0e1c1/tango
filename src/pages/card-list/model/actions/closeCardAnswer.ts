import { cardListStore } from "../store";

export function closeCardAnswer(): void {
  cardListStore.setState({ shownCard: undefined });
}
