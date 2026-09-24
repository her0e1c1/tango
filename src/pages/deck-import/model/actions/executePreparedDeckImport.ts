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
  const deckBatch = writeBatch(db);
  writeDeckCreate(deckBatch, uid, prepared.destination);
  void deckBatch.commit().catch(() => undefined);

  // Firestore preserves this client's queued write order; Cards follow the destination Deck without waiting for cloud ACK.
  const cardBatch = writeBatch(db);
  for (const mutation of prepared.mutations) {
    if (mutation.kind !== "create") throw new Error("Deck import only supports Card creation");
    writeCardCreate(cardBatch, uid, mutation.card);
  }
  void cardBatch.commit().catch(() => undefined);
}
