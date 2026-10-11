import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";

import { deckImportStore } from "../store";

export function completeDeckImport(): boolean {
  const { status, source } = deckImportStore.getState();
  if (status !== "importing" || source.kind !== "selected" || source.preparedImport === undefined) return false;

  const pendingImport = source.preparedImport;
  const deckReady = getDecks().some((deck) => deck.id === pendingImport.destination.id);
  const cardIds = pendingImport.mutations.flatMap((mutation) => (mutation.kind === "create" ? [mutation.card.id] : []));
  const cards = getCards();
  if (!deckReady || cardIds.some((id) => !cards.some((card) => card.id === id))) return false;

  showToast({
    messageKey: "deckImport.toast.imported",
    messageParams: { count: cardIds.length },
    tone: "success",
  });
  deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
  return true;
}
