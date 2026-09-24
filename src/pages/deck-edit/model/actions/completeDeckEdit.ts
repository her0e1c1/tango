import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";

import { deckEditPageStore } from "../store";
import type { PendingDeckSave } from "./submitDeckEdit";

export function completeDeckEdit(pending: PendingDeckSave | undefined): boolean {
  if (pending === undefined) return false;
  const deck = getDecks().find(({ id }) => id === pending.deckId);
  if (
    deck === undefined ||
    deck.name !== pending.name ||
    JSON.stringify(deck.tags ?? []) !== JSON.stringify(pending.tags)
  )
    return false;
  const cards = getCards();
  if (
    pending.cards.some((expected) => {
      const card = cards.find(({ id }) => id === expected.id);
      return card === undefined || JSON.stringify(card.tags) !== JSON.stringify(expected.tags);
    })
  )
    return false;
  deckEditPageStore.setState({ submission: undefined });
  showToast({ messageKey: "deckForm.toast.updated", messageParams: { name: pending.name }, tone: "success" });
  return true;
}
