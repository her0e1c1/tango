import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLocalDeck } from "@/test/factories";
import { useDecks } from "../model/hooks";
import { deckStore } from "../model/store";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  onSnapshot: vi.fn(),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  where: mocks.where,
}));
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { subscribeDecks } from "./firestore";

// Builds a Firestore-like Deck document with optional field overrides.
const deckDocument = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  data: () => ({
    name: "Remote Deck",
    uid: "uid-a",
    createdAt: 1,
    updatedAt: 2,
    deletedAt: null,
    scoreMax: null,
    scoreMin: null,
    selectedTags: [],
    tagAndFilter: false,
    category: "",
    convertToBr: false,
    ...overrides,
  }),
});

// Returns the snapshot callback registered by the Deck subscription.
const getSnapshotHandler = () =>
  mocks.onSnapshot.mock.calls[0]?.[1] as (snapshot: { docs: ReturnType<typeof deckDocument>[] }) => void;
// Returns the error callback registered by the Deck subscription.
const getErrorHandler = () => mocks.onSnapshot.mock.calls[0]?.[2] as (error: Error) => void;

describe("Deck Firestore subscription", () => {
  beforeEach(() => {
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(vi.fn());
  });

  it("replaces the store with active Decks", () => {
    const localDeck = createLocalDeck({ id: "local", name: "Local Deck" });
    deckStore.setState({ localDecks: [localDeck] });
    const { result } = renderHook(useDecks);
    subscribeDecks("uid-a", vi.fn());

    act(() =>
      getSnapshotHandler()({
        docs: [deckDocument("active", { url: "https://example.com" }), deckDocument("deleted", { deletedAt: 3 })],
      })
    );

    expect(result.current).toEqual([
      expect.objectContaining({ id: "active", url: "https://example.com", localMode: false }),
      localDeck,
    ]);
  });

  it("reports invalid Firestore documents", () => {
    const onError = vi.fn();
    subscribeDecks("uid-a", onError);

    act(() => getSnapshotHandler()({ docs: [deckDocument("invalid", { selectedTags: [42] })] }));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
  });

  it("reports Firestore subscription errors", () => {
    const onError = vi.fn();
    subscribeDecks("uid-a", onError);
    const error = new Error("subscription failed");

    getErrorHandler()(error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
