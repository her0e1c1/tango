import { beforeEach, describe, expect, it, vi } from "vitest";

type TestDocument = { id: string; data: () => Record<string, unknown> };
type TestChange = { type: "added" | "modified" | "removed"; doc: TestDocument };
type TestSnapshot = {
  docs: TestDocument[];
  docChanges: () => TestChange[];
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
};

const mocks = vi.hoisted(() => ({
  next: undefined as ((snapshot: TestSnapshot) => void) | undefined,
  error: undefined as ((error: Error) => void) | undefined,
  unsubscribe: vi.fn(),
  where: vi.fn((...parts: unknown[]) => parts),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  where: mocks.where,
  orderBy: vi.fn((...parts: unknown[]) => parts),
  query: vi.fn((...parts: unknown[]) => parts),
  onSnapshot: vi.fn(
    (_query: unknown, _options: unknown, next: (snapshot: TestSnapshot) => void, error: (received: Error) => void) => {
      mocks.next = next;
      mocks.error = error;
      return mocks.unsubscribe;
    }
  ),
}));
vi.mock("@/adapters/firestore/runtime", () => ({ getDb: () => "db" }));

import { subscribeCardReads, subscribeDeckReads } from "@/adapters/firestore/event";

const document = (id: string, data: Record<string, unknown>): TestDocument => ({ id, data: () => data });
const snapshot = (
  docs: TestDocument[],
  changes: TestChange[] = [],
  metadata: TestSnapshot["metadata"] = { fromCache: false, hasPendingWrites: false }
): TestSnapshot => ({
  docs,
  docChanges: () => changes,
  metadata,
});

const deckDocument = (overrides: Record<string, unknown> = {}) => ({
  id: "payload-deck",
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
});

const cardDocument = (overrides: Record<string, unknown> = {}) => ({
  id: "payload-card",
  frontText: "Remote front",
  backText: "Remote back",
  tags: [],
  uniqueKey: "remote-key",
  deckId: "deck-a",
  uid: "uid-a",
  createdAt: 1,
  updatedAt: 2,
  deletedAt: null,
  score: 0,
  numberOfSeen: 0,
  ...overrides,
});

describe("Firestore remote-read subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.next = undefined;
    mocks.error = undefined;
  });

  it("emits an empty Deck replacement for the initial snapshot", () => {
    const onSnapshot = vi.fn();

    const unsubscribe = subscribeDeckReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });
    mocks.next?.(snapshot([]));

    expect(unsubscribe).toBe(mocks.unsubscribe);
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    expect(onSnapshot).toHaveBeenCalledWith({
      type: "replace",
      items: [],
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
  });

  it("maps active Decks and omits logical deletions from the initial replacement", () => {
    const onSnapshot = vi.fn();
    subscribeDeckReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });

    mocks.next?.(
      snapshot([document("deck-a", deckDocument()), document("deck-deleted", deckDocument({ deletedAt: 3 }))])
    );

    expect(onSnapshot).toHaveBeenCalledWith({
      type: "replace",
      items: [expect.objectContaining({ id: "deck-a", name: "Remote Deck" })],
      metadata: { size: 2, fromCache: false, hasPendingWrites: false },
    });
  });

  it("emits Deck deltas after the initial replacement", () => {
    const onSnapshot = vi.fn();
    subscribeDeckReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });
    mocks.next?.(snapshot([]));
    onSnapshot.mockClear();

    mocks.next?.(
      snapshot(
        [],
        [
          { type: "added", doc: document("deck-added", deckDocument({ updatedAt: 3 })) },
          { type: "modified", doc: document("deck-modified", deckDocument({ updatedAt: 4 })) },
          { type: "modified", doc: document("deck-deleted", deckDocument({ updatedAt: 5, deletedAt: 5 })) },
          { type: "removed", doc: document("deck-removed", deckDocument({ updatedAt: 6 })) },
        ],
        { fromCache: true, hasPendingWrites: true }
      )
    );

    expect(onSnapshot).toHaveBeenCalledWith({
      type: "change",
      event: {
        added: [expect.objectContaining({ id: "deck-added" })],
        modified: [expect.objectContaining({ id: "deck-modified" })],
        removed: ["deck-deleted", "deck-removed"],
      },
      metadata: { size: 4, fromCache: true, hasPendingWrites: true },
    });
  });

  it("maps Card replacements and deltas through the Card mapper", () => {
    const onSnapshot = vi.fn();
    subscribeCardReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });

    mocks.next?.(snapshot([document("card-a", cardDocument({ nextSeeingAt: { toDate: () => new Date(50) } }))]));
    expect(onSnapshot).toHaveBeenLastCalledWith({
      type: "replace",
      items: [expect.objectContaining({ id: "card-a", nextSeeingAt: new Date(50) })],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });

    mocks.next?.(snapshot([], [{ type: "modified", doc: document("card-a", cardDocument({ frontText: "Updated" })) }]));
    expect(onSnapshot).toHaveBeenLastCalledWith({
      type: "change",
      event: {
        added: [],
        modified: [expect.objectContaining({ id: "card-a", frontText: "Updated" })],
        removed: [],
      },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
  });

  it("emits metadata-only snapshots so pending writes can become synced", () => {
    const onSnapshot = vi.fn();
    subscribeDeckReads({ uid: "uid-a", onSnapshot, onError: vi.fn() });
    mocks.next?.(snapshot([], [], { fromCache: true, hasPendingWrites: true }));
    onSnapshot.mockClear();

    mocks.next?.(snapshot([], [], { fromCache: false, hasPendingWrites: false }));

    expect(onSnapshot).toHaveBeenCalledWith({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
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
