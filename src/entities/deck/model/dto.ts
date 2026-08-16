import type { DeckCreate, DeckDocument, DeckDomain, DeckId, DeckStore, DeckView, LocalDeck, RemoteDeck } from "./types";

// Zod may retain explicit undefined at input boundaries; every mapper removes it before creating Domain-backed data.
type DeckDomainDto = Omit<DeckDomain, "url"> & { url?: string | undefined };

export const toLocalDeckStore = (deck: DeckDomainDto): LocalDeck => ({
  id: deck.id,
  localMode: true,
  name: deck.name,
  ...(deck.url === undefined ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  createdAt: deck.createdAt,
  updatedAt: deck.updatedAt,
});

export const toRemoteDeckStore = (id: DeckId, document: DeckDocument): RemoteDeck => ({
  id,
  uid: document.uid,
  localMode: false,
  name: document.name,
  ...(document.url === undefined ? {} : { url: document.url }),
  isPublic: document.isPublic,
  scoreMax: document.scoreMax,
  scoreMin: document.scoreMin,
  selectedTags: [...document.selectedTags],
  tagAndFilter: document.tagAndFilter,
  category: document.category,
  convertToBr: document.convertToBr,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

/** Keep persistence metadata and mutable store collections behind the Entity boundary. */
export const toDeckView = (deck: DeckStore): DeckView => ({
  id: deck.id,
  name: deck.name,
  ...(deck.url === undefined ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  createdAt: deck.createdAt,
  updatedAt: deck.updatedAt,
  localMode: deck.localMode,
});

export const toDeckDocument = (deck: DeckCreate, timestamp: number): DeckDocument => ({
  id: deck.id,
  uid: deck.uid,
  name: deck.name,
  ...(deck.url === undefined ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  deletedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});
