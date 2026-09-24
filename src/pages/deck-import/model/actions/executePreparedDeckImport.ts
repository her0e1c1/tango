import { getAuthUid } from "@/entities/auth";
import { ImportFailure } from "../../lib/importFailure";
import { writeCardCreate, type CardMutation } from "@/entities/card";
import { writeDeckCreate, type RemoteDeckCreateInput } from "@/entities/deck";
import { db, writeBatch } from "@/shared/firebase";

export interface PreparedDeckImport {
  uid: string;
  destination: RemoteDeckCreateInput;
  mutations: CardMutation[];
}

export function executePreparedDeckImport(prepared: PreparedDeckImport): void {
  const uid = getAuthUid();
  if (prepared.uid !== uid) throw new ImportFailure("account-changed");
  const batch = writeBatch(db);
  writeDeckCreate(batch, uid, prepared.destination);
  for (const mutation of prepared.mutations) {
    if (mutation.kind !== "create") throw new Error("Deck import only supports Card creation");
    writeCardCreate(batch, uid, mutation.card);
  }
  void batch.commit().catch(() => undefined);
}
