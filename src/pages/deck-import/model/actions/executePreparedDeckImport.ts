import { getAuthUid } from "@/entities/auth";
import { mutateCards, type CardMutation } from "@/entities/card";
import { createDeck, type RemoteDeckCreateInput } from "@/entities/deck";
import { ImportFailure } from "../../lib/importFailure";

export interface PreparedDeckImport {
  uid: string;
  destination: RemoteDeckCreateInput;
  mutations: CardMutation[];
}

export async function executePreparedDeckImport(prepared: PreparedDeckImport): Promise<void> {
  const uid = getAuthUid();
  if (prepared.uid !== uid) throw new ImportFailure("account-changed");
  await createDeck(uid, prepared.destination);
  if (prepared.mutations.length > 0) await mutateCards(uid, prepared.mutations);
}
