import type { Deck, DeckCreateInput, DeckId, EditDeckInput, RemoteDeck } from "../model/types";

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { editDeckDomain, isDeckOwnedBy, type DeckDomain, type EditDeckDomainInput } from "../model/domain";
import {
  toDeckDocument,
  toDeckDomainEdit,
  toDeckDomainFromCreate,
  toDeckDomainFromDocument,
  toDeckDomainFromStore,
  toDeckView,
  toRemoteDeckStore,
} from "../model/dto";
import { createDeckSchema, deleteDeckSchema, editDeckSchema } from "../model/schema";
import { replaceRemoteDecks } from "../model/store";
import { parseDeckDocument } from "./document";

const DECK_COLLECTION = "deck";
const CARD_COLLECTION = "card";

// Parses an active remote Deck into canonical domain state while omitting tombstoned documents.
const readActiveRemoteDeckDomain = (id: DeckId, value: unknown): DeckDomain | undefined => {
  const document = parseDeckDocument(id, value);
  return document.deletedAt === null ? toDeckDomainFromDocument(id, document) : undefined;
};

// Rejects an authenticated actor who does not own the current remote Deck domain state.
const assertDeckOwner = (deck: DeckDomain, actorId: string): void => {
  if (!isDeckOwnedBy(deck, actorId)) throw new Error("Deck owner does not match the authenticated user");
};

// Subscribes the remote Deck store to active documents owned by one user.
export const subscribeDecks = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, DECK_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const decks = snapshot.docs.flatMap((document) => {
          const deck = readActiveRemoteDeckDomain(document.id, document.data());
          return deck === undefined ? [] : [toRemoteDeckStore(deck)];
        });
        replaceRemoteDecks(decks);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

// Fetches an authoritative snapshot of active Deck views owned by one user.
export const fetchDecks = async (uid: string): Promise<Deck[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, DECK_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs.flatMap((document) => {
    const deck = readActiveRemoteDeckDomain(document.id, document.data());
    return deck === undefined ? [] : [toDeckView(deck, false)];
  });
};

// Validates a remote creation command, creates canonical domain state, and writes its Firestore document.
export const createDeck = async (uid: string, deck: DeckCreateInput): Promise<void> => {
  const input = createDeckSchema.parse({ uid, deck });
  const domain = toDeckDomainFromCreate(input.uid, input.deck, getCurrentTimeMillis());
  await setDoc(doc(db, DECK_COLLECTION, domain.id), toDeckDocument(domain));
};

// Writes only requested editable fields while sourcing their values from updated canonical domain state.
const updateDeckDocument = async (deck: DeckDomain, edit: EditDeckDomainInput): Promise<void> => {
  const document = omitUndefined({
    name: edit.name === undefined ? undefined : deck.name,
    url: edit.url === undefined ? undefined : deck.url === null ? deleteField() : deck.url,
    isPublic: edit.isPublic === undefined ? undefined : deck.isPublic,
    updatedAt: deck.updatedAt,
    scoreMax: edit.scoreMax === undefined ? undefined : deck.scoreMax,
    scoreMin: edit.scoreMin === undefined ? undefined : deck.scoreMin,
    selectedTags: edit.selectedTags === undefined ? undefined : [...deck.selectedTags],
    tagAndFilter: edit.tagAndFilter === undefined ? undefined : deck.tagAndFilter,
    category: edit.category === undefined ? undefined : deck.category,
    convertToBr: edit.convertToBr === undefined ? undefined : deck.convertToBr,
  });
  await updateDoc(doc(db, DECK_COLLECTION, deck.id), document);
};

// Validates ownership and applies a remote Deck edit through the canonical domain transition.
export const editDeck = async (uid: string, currentDeck: RemoteDeck, deck: EditDeckInput["deck"]): Promise<void> => {
  const input = editDeckSchema.parse({ uid, deck });
  const currentDomain = toDeckDomainFromStore(currentDeck);
  assertDeckOwner(currentDomain, input.uid);
  const domainEdit = toDeckDomainEdit(input.deck);
  const updatedDomain = editDeckDomain(currentDomain, domainEdit, getCurrentTimeMillis());
  await updateDeckDocument(updatedDomain, domainEdit);
};

// Deletes a remote Deck and every child Card document owned by the same user.
const deleteDeckDocuments = async (uid: string, deckId: string): Promise<void> => {
  // Remove child Cards first so a partial failure leaves a recoverable Deck instead of orphaned Card documents.
  const snapshot = await getDocs(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid), where("deckId", "==", deckId))
  );
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  await deleteDoc(doc(db, DECK_COLLECTION, deckId));
};

// Validates ownership before deleting the current remote Deck domain graph.
export const deleteDeck = async (uid: string, currentDeck: RemoteDeck): Promise<void> => {
  const domain = toDeckDomainFromStore(currentDeck);
  const input = deleteDeckSchema.parse({ uid, deckId: domain.id });
  assertDeckOwner(domain, input.uid);
  await deleteDeckDocuments(input.uid, input.deckId);
};
