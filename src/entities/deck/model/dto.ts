import type { DeckDocument } from "../api/document";
import {
  createDeckDomain,
  restoreDeckDomain,
  type DeckDomain,
  type EditDeckDomainInput,
} from "./domain";
import type {
  Deck,
  DeckCreate,
  DeckEdit,
  DeckId,
  DeckStore,
  LocalDeck,
  PersistedLocalDeck,
  RemoteDeck,
} from "./types";

// Maps one validated public creation command into canonical Deck domain state.
export const toDeckDomainFromCreate = (ownerId: string | null, deck: DeckCreate, timestamp: number): DeckDomain =>
  createDeckDomain(
    {
      id: deck.id,
      ownerId,
      name: deck.name,
      ...(deck.url === undefined ? {} : { url: deck.url }),
      isPublic: deck.isPublic,
      scoreMax: deck.scoreMax,
      scoreMin: deck.scoreMin,
      selectedTags: deck.selectedTags,
      tagAndFilter: deck.tagAndFilter,
      category: deck.category,
      convertToBr: deck.convertToBr,
    },
    timestamp
  );

// Maps one validated public edit command into the Deck domain transition input.
export const toDeckDomainEdit = (edit: DeckEdit): EditDeckDomainInput => ({
  id: edit.id,
  ...(edit.name === undefined ? {} : { name: edit.name }),
  ...(edit.url === undefined ? {} : { url: edit.url }),
  ...(edit.isPublic === undefined ? {} : { isPublic: edit.isPublic }),
  ...(edit.scoreMax === undefined ? {} : { scoreMax: edit.scoreMax }),
  ...(edit.scoreMin === undefined ? {} : { scoreMin: edit.scoreMin }),
  ...(edit.selectedTags === undefined ? {} : { selectedTags: [...edit.selectedTags] }),
  ...(edit.tagAndFilter === undefined ? {} : { tagAndFilter: edit.tagAndFilter }),
  ...(edit.category === undefined ? {} : { category: edit.category }),
  ...(edit.convertToBr === undefined ? {} : { convertToBr: edit.convertToBr }),
});

// Maps one validated local-storage record into canonical Deck domain state.
export const toDeckDomainFromLocalPersistence = (deck: PersistedLocalDeck): DeckDomain =>
  restoreDeckDomain({
    id: deck.id,
    ownerId: null,
    name: deck.name,
    ...(deck.url === undefined ? {} : { url: deck.url }),
    isPublic: deck.isPublic,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  });

// Maps one internal store record into canonical Deck domain state.
export const toDeckDomainFromStore = (deck: DeckStore): DeckDomain =>
  restoreDeckDomain({
    id: deck.id,
    ownerId: deck.localMode ? null : deck.uid,
    name: deck.name,
    ...(deck.url === undefined ? {} : { url: deck.url }),
    isPublic: deck.isPublic,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  });

// Maps one validated Firestore document into canonical Deck domain state.
export const toDeckDomainFromDocument = (id: DeckId, document: DeckDocument): DeckDomain =>
  restoreDeckDomain({
    id,
    ownerId: document.uid,
    name: document.name,
    ...(document.url === undefined ? {} : { url: document.url }),
    isPublic: document.isPublic,
    scoreMax: document.scoreMax,
    scoreMin: document.scoreMin,
    selectedTags: document.selectedTags,
    tagAndFilter: document.tagAndFilter,
    category: document.category,
    convertToBr: document.convertToBr,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  });

// Maps canonical local Deck domain state into the Zustand and local-storage record shape.
export const toLocalDeckStore = (deck: DeckDomain): LocalDeck => {
  if (deck.ownerId !== null) throw new Error("Local Deck domain must not have an account owner");

  return {
    id: deck.id,
    localMode: true,
    name: deck.name,
    ...(deck.url === null ? {} : { url: deck.url }),
    isPublic: deck.isPublic,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: [...deck.selectedTags],
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
};

// Maps canonical account-owned Deck domain state into the remote Zustand record shape.
export const toRemoteDeckStore = (deck: DeckDomain): RemoteDeck => {
  if (deck.ownerId === null) throw new Error("Remote Deck domain requires an account owner");

  return {
    id: deck.id,
    uid: deck.ownerId,
    localMode: false,
    name: deck.name,
    ...(deck.url === null ? {} : { url: deck.url }),
    isPublic: deck.isPublic,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: [...deck.selectedTags],
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
};

/** Maps canonical Deck domain state and storage metadata into the public read model. */
export const toDeckView = (deck: DeckDomain, localMode: boolean): Deck => ({
  id: deck.id,
  name: deck.name,
  ...(deck.url === null ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  createdAt: deck.createdAt,
  updatedAt: deck.updatedAt,
  localMode,
});

// Maps canonical account-owned Deck domain state into its Firestore document fields.
export const toDeckDocument = (deck: DeckDomain): DeckDocument => {
  if (deck.ownerId === null) throw new Error("Remote Deck document requires an account owner");

  return {
    id: deck.id,
    uid: deck.ownerId,
    name: deck.name,
    ...(deck.url === null ? {} : { url: deck.url }),
    isPublic: deck.isPublic,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: [...deck.selectedTags],
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
    deletedAt: null,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
};
