import type { Card, CardId } from "../types";
import { useCards } from "./useCards";

export const useCard = (id: CardId | undefined): Card | undefined => useCards().find((card) => card.id === id);
