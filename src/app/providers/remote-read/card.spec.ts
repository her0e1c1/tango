import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearCards, useCards } from "@/entities/card";

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

import { subscribeCards } from "./card";

const cardDocument = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  data: () => ({
    frontText: "Front",
    backText: "Back",
    tags: [],
    uniqueKey: id,
    deckId: "deck-a",
    uid: "uid-a",
    createdAt: 1,
    updatedAt: 2,
    deletedAt: null,
    score: 0,
    numberOfSeen: 0,
    ...overrides,
  }),
});

const getSnapshotHandler = () =>
  mocks.onSnapshot.mock.calls[0]?.[1] as (snapshot: { docs: ReturnType<typeof cardDocument>[] }) => void;

describe("Card app synchronization", () => {
  beforeEach(() => {
    clearCards();
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(mocks.unsubscribe);
  });

  it("subscribes by UID and replaces the store with active Cards", () => {
    const { result } = renderHook(useCards);
    const onReady = vi.fn();
    const unsubscribe = subscribeCards("uid-a", onReady, vi.fn());

    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    act(() =>
      getSnapshotHandler()({
        docs: [cardDocument("active", { url: "https://example.com" }), cardDocument("deleted", { deletedAt: 3 })],
      })
    );

    expect(result.current).toEqual([expect.objectContaining({ id: "active", url: "https://example.com" })]);
    expect(onReady).toHaveBeenCalledOnce();
    unsubscribe();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("reports invalid Firestore documents", () => {
    const onReady = vi.fn();
    const onError = vi.fn();
    subscribeCards("uid-a", onReady, onError);

    act(() => getSnapshotHandler()({ docs: [cardDocument("invalid", { tags: [42] })] }));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
    expect(onReady).not.toHaveBeenCalled();
  });
});
