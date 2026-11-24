import { getAuthUid } from "@/entities/auth";
import { waitForCards } from "@/entities/card";
import { waitForDeck } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";

import { deckImportStore } from "../store";

export async function completeDeckImport(signal: AbortSignal): Promise<boolean> {
  const { status, source } = deckImportStore.getState();
  if (status !== "importing" || source.kind !== "selected" || source.preparedImport === undefined) return false;

  const pendingImport = source.preparedImport;
  const cardIds = pendingImport.mutations.flatMap((mutation) => (mutation.kind === "create" ? [mutation.card.id] : []));
  if (!(await waitForDeck(pendingImport.uid, pendingImport.destination.id, signal))) return false;
  if (!(await waitForCards(pendingImport.uid, cardIds, signal))) return false;
  if (signal.aborted || getAuthUid() !== pendingImport.uid) return false;
  if (deckImportStore.getState().source !== source || deckImportStore.getState().status !== "importing") return false;

  showToast({
    messageKey: "deckImport.toast.imported",
    messageParams: { count: cardIds.length },
    tone: "success",
  });
  deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
  return true;
}
