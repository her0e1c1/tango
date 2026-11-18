import { io, events } from "./io";

export {
  useDeck,
  useDecks,
  subscribeDecks,
  CATEGORY,
  getStudyFilter,
  getCardFilter,
  getCategory,
  isHighlightLanguage,
  mustFindDeckById,
  deckFormSchema,
  deckStore,
  clearRemoteDecks,
  getDecks,
} from "../../../src/entities/deck";
export type {
  CardFilter,
  Deck,
  DeckId,
  RemoteDeckCreateInput,
} from "../../../src/entities/deck";

export const createDeck: typeof io.createDeck = (...args) => {
  events.push({ name: "createDeck", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.createDeck(...args);
};
export const editDeck: typeof io.editDeck = (...args) => {
  events.push({ name: "editDeck", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.editDeck(...args);
};
export const deleteDeck: typeof io.deleteDeck = (...args) => {
  events.push({ name: "deleteDeck", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.deleteDeck(...args);
};
