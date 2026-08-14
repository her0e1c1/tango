import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearDecks, useDecks } from "@/entities/deck";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  onSnapshot: vi.fn(),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
  unsubscribe: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  where: mocks.where,
}));
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { subscribeDecks } from "./deck";

const deckDocument = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  data: () => ({
    name: "Remote Deck",
    isPublic: false,
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

const getSnapshotHandler = () =>
  mocks.onSnapshot.mock.calls[0]?.[1] as (snapshot: { docs: ReturnType<typeof deckDocument>[] }) => void;

describe("Deck app synchronization", () => {
  beforeEach(() => {
    clearDecks();
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(mocks.unsubscribe);
  });

  it("subscribes by UID and replaces the store with active Decks", () => {
    const { result } = renderHook(useDecks);
    const unsubscribe = subscribeDecks("uid-a", vi.fn());

    expect(mocks.collection).toHaveBeenCalledWith("db", "deck");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    act(() =>
      getSnapshotHandler()({
        docs: [deckDocument("active", { url: "https://example.com" }), deckDocument("deleted", { deletedAt: 3 })],
      })
    );

    expect(result.current).toEqual([expect.objectContaining({ id: "active", url: "https://example.com" })]);
    unsubscribe();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("reports invalid Firestore documents", () => {
    const onError = vi.fn();
    subscribeDecks("uid-a", onError);

    act(() => getSnapshotHandler()({ docs: [deckDocument("invalid", { selectedTags: [42] })] }));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
  });

  it("ignores snapshots and errors after unsubscribe", () => {
    const { result } = renderHook(useDecks);
    const onError = vi.fn();
    const unsubscribe = subscribeDecks("uid-a", onError);
    const snapshotHandler = getSnapshotHandler();
    const errorHandler = mocks.onSnapshot.mock.calls[0]?.[2] as (error: Error) => void;

    unsubscribe();
    act(() => snapshotHandler({ docs: [deckDocument("late")] }));
    errorHandler(new Error("late"));

    expect(result.current).toEqual([]);
    expect(onError).not.toHaveBeenCalled();
  });
});
