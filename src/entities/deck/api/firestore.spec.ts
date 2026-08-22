import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture, createLocalDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  addCardCreatesToBatch: vi.fn(),
  collection: vi.fn(() => ({})),
  deleteLocalCardsByDeckId: vi.fn(),
  onSnapshot: vi.fn(
    (
      _query: unknown,
      _onNext: (snapshot: { docs: Array<{ id: string; data: () => unknown }> }) => void,
      _onError?: (error: Error) => void
    ) => vi.fn()
  ),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
}));

vi.mock("@/entities/card/@x/deck", () => ({
  addCardCreatesToBatch: mocks.addCardCreatesToBatch,
  deleteLocalCardsByDeckId: mocks.deleteLocalCardsByDeckId,
}));

vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  collection: mocks.collection,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  where: mocks.where,
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { deckStore } from "../model/store";
import {
  beginDeckMigration,
  createDeck,
  deleteDeck,
  editDeck,
  finalizeDeckMigration,
  subscribeDecks,
} from "./firestore";

describe("Deck Firestore persistence", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(vi.fn());
    deckStore.setState({ remoteDecks: [], localDecks: [] });
  });

  it("rejects create requests without a confirmed matching owner", async () => {
    await expect(createDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(createDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });

  it("rejects edit requests without a confirmed user", async () => {
    await expect(editDeck("", { id: deck.id })).rejects.toThrow("confirmed user");
  });

  it("rejects delete requests without a confirmed user or Deck id", async () => {
    await expect(deleteDeck("", deck.id)).rejects.toThrow("confirmed user");
    await expect(deleteDeck(deck.uid, "")).rejects.toThrow("Deck id");
  });

  it("rejects migration requests without a confirmed user", async () => {
    const migration = { id: "migration", revision: 0, fingerprint: "a".repeat(64) };
    await expect(beginDeckMigration("", deck, migration)).rejects.toThrow("confirmed user");
    await expect(finalizeDeckMigration("", deck.id, migration)).rejects.toThrow("confirmed user");
  });

  it("removes persisted local data when a completed migration arrives after reload", () => {
    const migration = { id: "migration", revision: 2, fingerprint: "a".repeat(64) };
    const localDeck = createLocalDeck({ id: "migrating", localRevision: migration.revision, migration });
    const remoteDeck = createDeckFixture({ id: localDeck.id, migration });
    const { localMode: _localMode, migration: _migration, ...remoteDocument } = remoteDeck;
    deckStore.setState({ localDecks: [localDeck] });
    subscribeDecks("uid", vi.fn());
    const onNext = mocks.onSnapshot.mock.calls[0]?.[1];
    if (typeof onNext !== "function") throw new Error("Expected Deck snapshot callback");

    onNext({
      docs: [
        {
          id: remoteDeck.id,
          data: () => ({
            ...remoteDocument,
            deletedAt: null,
            migration: { ...migration, state: "complete" },
          }),
        },
      ],
    });

    expect(deckStore.getState()).toEqual({ remoteDecks: [remoteDeck], localDecks: [] });
    expect(mocks.deleteLocalCardsByDeckId).toHaveBeenCalledExactlyOnceWith(localDeck.id);
  });

  it("keeps a different local snapshot when a completed migration arrives", () => {
    const localMigration = { id: "local", revision: 1, fingerprint: "a".repeat(64) };
    const remoteMigration = { id: "remote", revision: 1, fingerprint: "b".repeat(64) };
    const localDeck = createLocalDeck({ id: "migrating", localRevision: 1, migration: localMigration });
    const remoteDeck = createDeckFixture({ id: localDeck.id, migration: remoteMigration });
    const { localMode: _localMode, migration: _migration, ...remoteDocument } = remoteDeck;
    deckStore.setState({ localDecks: [localDeck] });
    subscribeDecks("uid", vi.fn());
    const onNext = mocks.onSnapshot.mock.calls[0]?.[1];
    if (typeof onNext !== "function") throw new Error("Expected Deck snapshot callback");

    onNext({
      docs: [
        {
          id: remoteDeck.id,
          data: () => ({
            ...remoteDocument,
            deletedAt: null,
            migration: { ...remoteMigration, state: "complete" },
          }),
        },
      ],
    });

    expect(deckStore.getState()).toEqual({ remoteDecks: [], localDecks: [localDeck] });
    expect(mocks.deleteLocalCardsByDeckId).not.toHaveBeenCalled();
  });
});
