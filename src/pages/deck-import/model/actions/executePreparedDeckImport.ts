import { ImportFailure } from "../../lib/importFailure";
import { mutateCards, type CardMutation } from "@/entities/card";
import { createDeck, type LocalDeckCreateInput, type RemoteDeckCreateInput } from "@/entities/deck";

export interface PreparedDeckImport {
  uid: string;
  destination: RemoteDeckCreateInput | LocalDeckCreateInput;
  mutations: CardMutation[];
}

export async function executePreparedDeckImport(uid: string, prepared: PreparedDeckImport): Promise<void> {
  if (prepared.uid !== uid) throw new ImportFailure("account-changed");
  // Cards depend on the destination existing; retry the prepared identities after any partial failure.
  await createDeck(uid, prepared.destination);
  if (prepared.mutations.length > 0) await mutateCards(uid, prepared.mutations);
}
