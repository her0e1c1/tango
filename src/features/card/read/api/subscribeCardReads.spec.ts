import { beforeEach, describe, expect, it, vi } from "vitest";

type TestDocument = { id: string; data: () => Record<string, unknown> };
type TestSnapshot = {
  docs: TestDocument[];
  docChanges: () => [];
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
};

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
  next: undefined as ((snapshot: TestSnapshot) => void) | undefined,
  error: undefined as ((error: Error) => void) | undefined,
  unsubscribe: vi.fn(),
  onSnapshot: vi.fn(
    (_query: unknown, _options: unknown, next: (snapshot: TestSnapshot) => void, error: (cause: Error) => void) => {
      mocks.next = next;
      mocks.error = error;
      return mocks.unsubscribe;
    }
  ),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  query: mocks.query,
  where: mocks.where,
  onSnapshot: mocks.onSnapshot,
}));
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { subscribeCardReads } from "./subscribeCardReads";

const cardDocument = (deletedAt: number | null = null) => ({
  frontText: "Front",
  backText: "Back",
  tags: [],
  uniqueKey: "key",
  deckId: "deck-a",
  uid: "uid-a",
  createdAt: 1,
  updatedAt: 2,
  deletedAt,
  score: 0,
  numberOfSeen: 0,
});

const document = (id: string, data: Record<string, unknown>): TestDocument => ({ id, data: () => data });

const snapshot = (
  docs: TestDocument[],
  metadata: TestSnapshot["metadata"] = { fromCache: false, hasPendingWrites: false }
): TestSnapshot => ({ docs, docChanges: () => [], metadata });

describe("subscribeCardReads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.next = undefined;
    mocks.error = undefined;
  });

  it("publishes active Cards from the requested user's collection", () => {
    const onSnapshot = vi.fn();
    const onError = vi.fn();
    const unsubscribe = subscribeCardReads({ uid: "uid-a", onSnapshot, onError });

    mocks.next?.(snapshot([document("active", cardDocument()), document("deleted", cardDocument(3))]));

    expect(unsubscribe).toBe(mocks.unsubscribe);
    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    expect(mocks.onSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      { includeMetadataChanges: true },
      expect.any(Function),
      onError
    );
    expect(onSnapshot).toHaveBeenCalledWith({
      itemsById: { active: expect.objectContaining({ id: "active", deletedAt: null }) },
      syncStatus: "synced",
    });
  });

  it("replaces the full result on every snapshot", () => {
    const onSnapshot = vi.fn();
    subscribeCardReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });
    mocks.next?.(snapshot([document("old", cardDocument())]));

    mocks.next?.(snapshot([document("current", { ...cardDocument(), frontText: "Current" })]));

    expect(onSnapshot).toHaveBeenLastCalledWith({
      itemsById: { current: expect.objectContaining({ id: "current", frontText: "Current" }) },
      syncStatus: "synced",
    });
  });

  it.each([
    [{ fromCache: true, hasPendingWrites: false }, "cached"],
    [{ fromCache: true, hasPendingWrites: true }, "pending"],
    [{ fromCache: false, hasPendingWrites: false }, "synced"],
  ] as const)("derives %s metadata as %s", (metadata, syncStatus) => {
    const onSnapshot = vi.fn();
    subscribeCardReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });

    mocks.next?.(snapshot([], metadata));

    expect(onSnapshot).toHaveBeenCalledWith({ itemsById: {}, syncStatus });
  });

  it("does not publish a partial result when conversion fails", () => {
    const onSnapshot = vi.fn();
    const onError = vi.fn();
    subscribeCardReads({ uid: "uid-a", onSnapshot, onError });

    expect(() =>
      mocks.next?.(snapshot([document("valid", cardDocument()), document("invalid", { ...cardDocument(), uid: 1 })]))
    ).not.toThrow();

    expect(onSnapshot).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("forwards listener errors", () => {
    const error = new Error("listener failed");
    const onError = vi.fn();
    subscribeCardReads({ uid: "uid-a", onSnapshot: vi.fn(), onError });

    mocks.error?.(error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
