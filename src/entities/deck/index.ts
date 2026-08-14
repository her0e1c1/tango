export { createDeck, deleteDeck, editDeck, generateDeckId } from "./api/firestore";
export { CATEGORY, getCategory, isHighlightLanguage } from "./model/rules";
export { useDeck, useDecks } from "./model/hooks";
export { clearDecks, replaceDecks } from "./model/store";
export type {
  Category,
  Deck,
  DeckCreateInput,
  DeckEdit,
  DeckId,
} from "./model/types";
