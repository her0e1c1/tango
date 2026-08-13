import type { Deck } from "../model/deck";

export type { DeckId } from "../model/deck";
export type DeckForCard = Pick<Deck, "id" | "uid">;
export { deckMembershipMutationLock, withDeckMembershipLocks } from "../api/remoteMutationLocks";
