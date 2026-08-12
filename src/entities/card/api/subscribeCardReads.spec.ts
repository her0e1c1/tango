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
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  query: mocks.query,
  where: mocks.where,
  onSnapshot: vi.fn(
    (_query: unknown, _options: unknown, next: (snapshot: TestSnapshot) => void, error: (cause: Error) => void) => {
      mocks.next = next;
      mocks.error = error;
      return mocks.unsubscribe;
    }
  ),
}));
vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getDb: () => "db",
}));

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

describe("subscribeCardReads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.next = undefined;
    mocks.error = undefined;
  });

  it("publishes active Cards from the requested user's collection", () => {
    const onSnapshot = vi.fn();
    const unsubscribe = subscribeCardReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });

    mocks.next?.({
      docs: [document("active", cardDocument()), document("deleted", cardDocument(3))],
      docChanges: () => [],
      metadata: { fromCache: false, hasPendingWrites: false },
    });

    expect(unsubscribe).toBe(mocks.unsubscribe);
    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    expect(onSnapshot).toHaveBeenCalledWith({
      type: "replace",
      items: [expect.objectContaining({ id: "active", deletedAt: null })],
      metadata: { fromCache: false, hasPendingWrites: false },
    });
  });

  it("forwards listener errors", () => {
    const error = new Error("listener failed");
    const onError = vi.fn();
    subscribeCardReads({ uid: "uid-a", onSnapshot: vi.fn(), onError });

    mocks.error?.(error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
