import type { CardCreateCommand, CardEditInput, CardId, CardMutation } from "../model/types";
import { findDeckById } from "@/entities/deck/@x/card";
import { findCardById } from "../model/queries/findCardById";
import { createCard as createDocument, editCard as editDocument, deleteCard as deleteDocument } from "./firestore";

function requireOwnedCard(uid: string, id: CardId) {
  const card = findCardById(id);
  if (card === undefined) throw new Error(`Card "${id}" was not found`);
  if (!uid || card.uid !== uid) throw new Error("Card owner does not match the authenticated user");
  return card;
}

export async function createCard(uid: string, card: CardCreateCommand): Promise<void> {
  const deck = findDeckById(card.deckId);
  if (deck === undefined) throw new Error(`Deck "${card.deckId}" was not found`);
  if (!uid || deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
  await createDocument(uid, { ...card, uid });
}

export async function editCard(uid: string, card: CardEditInput): Promise<void> {
  requireOwnedCard(uid, card.id);
  await editDocument(uid, { ...card, uid });
}

export async function mutateCards(uid: string, mutations: CardMutation[]): Promise<void> {
  const results = await Promise.allSettled(
    mutations.map((mutation) =>
      mutation.kind === "create" ? createCard(uid, mutation.card) : editCard(uid, mutation.card)
    )
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}

export async function deleteCard(uid: string, id: CardId): Promise<void> {
  requireOwnedCard(uid, id);
  await deleteDocument(uid, { id, uid });
}
