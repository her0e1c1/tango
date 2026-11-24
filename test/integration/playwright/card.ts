import { io, events } from "./io";

export {
  useCards,
  useCard,
  useCardsByDeckId,
  useHasCards,
  useInvalidCardIds,
  subscribeCards,
  waitForCardContent,
  waitForCards,
  cardContentInputSchema,
  clearRemoteCards,
  findCardById,
  getCards,
  filterCardsByDeckId,
  filterCardsByTags,
  getCardContentValidationErrors,
  mustFindCardById,
  BackText,
  CardView,
  FrontText,
  calculateFsrsState,
  classifyFsrsState,
  getStudyRetrievability,
  studyRetentionTarget,
  fsrsStateSchema,
  instantSchema,
} from "../../../src/entities/card";
export type {
  Card,
  CardContentInput,
  CardId,
  CardMutation,
  CardRaw,
  FsrsState,
} from "../../../src/entities/card";

export const createCard: typeof io.createCard = (...args) => {
  events.push({ name: "createCard", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.createCard(...args);
};
export const editCard: typeof io.editCard = (...args) => {
  events.push({ name: "editCard", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.editCard(...args);
};
export const deleteCard: typeof io.deleteCard = (...args) => {
  events.push({ name: "deleteCard", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.deleteCard(...args);
};
