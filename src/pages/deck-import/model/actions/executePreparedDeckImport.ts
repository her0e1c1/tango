import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import type { PreparedDeckImport } from "../types";

export async function executePreparedDeckImport(uid: string, prepared: PreparedDeckImport): Promise<void> {
  if (prepared.uid !== uid) throw new Error("The prepared Deck import belongs to a different user");
  // Cards depend on the destination existing; retry the prepared identities after any partial failure.
  await createDeck(uid, prepared.destination);
  if (prepared.mutations.length > 0) await mutateCards(uid, prepared.mutations);
}
