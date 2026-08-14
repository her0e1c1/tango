import { act, renderHook } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearCards, useCards } from "@/entities/card";
import { resetCardRead, useCardReadState } from "@/features/card/read";

type TestDocument = { id: string; data: () => Record<string, unknown> };
type TestSnapshot = {
  docs: TestDocument[];
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
};
type Listener = {
  next: (snapshot: TestSnapshot) => void;
  error: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
  listeners: [] as Listener[],
  onSnapshot: vi.fn(
    (_query: unknown, _options: unknown, next: (snapshot: TestSnapshot) => void, error: (cause: Error) => void) => {
      const unsubscribe = vi.fn();
      mocks.listeners.push({ next, error, unsubscribe });
      return unsubscribe;
    }
  ),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    collection: mocks.collection,
    onSnapshot: mocks.onSnapshot,
    query: mocks.query,
    where: mocks.where,
  };
});
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { startCardSynchronization } from "./card";

const cardDocument = (id: string, overrides: Record<string, unknown> = {}): TestDocument => ({
  id,
  data: () => ({
    frontText: "Remote front",
    backText: "Remote back",
    tags: ["science"],
    uniqueKey: `key-${id}`,
    deckId: "deck-a",
    uid: "uid-a",
    createdAt: 1,
    updatedAt: 2,
    deletedAt: null,
    score: 3,
    numberOfSeen: 4,
    ...overrides,
  }),
});

const snapshot = (
  docs: TestDocument[],
  metadata: TestSnapshot["metadata"] = { fromCache: false, hasPendingWrites: false }
): TestSnapshot => ({ docs, metadata });

const renderCardState = () => renderHook(() => ({ cards: useCards(), read: useCardReadState() }));

const startCardSync = () => {
  let stop: () => void = () => undefined;
  act(() => {
    stop = startCardSynchronization("uid-a");
  });
  return stop;
};

describe("Card app synchronization", () => {
  beforeEach(() => {
    clearCards();
    resetCardRead();
    vi.clearAllMocks();
    mocks.listeners.length = 0;
  });

  it("subscribes by UID and fully replaces active Cards from each snapshot", () => {
    const { result } = renderCardState();
    const stop = startCardSync();

    expect(result.current.read.status).toBe("loading");
    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    expect(mocks.onSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      { includeMetadataChanges: true },
      expect.any(Function),
      expect.any(Function)
    );

    act(() =>
      mocks.listeners[0]?.next(
        snapshot([
          cardDocument("active", {
            lastSeenAt: 50,
            nextSeeingAt: Timestamp.fromMillis(60),
            interval: 7,
            url: "https://example.com/card",
            startLine: 8,
            endLine: 9,
          }),
          cardDocument("deleted", { deletedAt: 3 }),
        ])
      )
    );

    expect(result.current.cards).toEqual([
      expect.objectContaining({
        id: "active",
        lastSeenAt: 50,
        nextSeeingAt: new Date(60),
        interval: 7,
        url: "https://example.com/card",
        startLine: 8,
        endLine: 9,
      }),
    ]);
    expect(result.current.read).toMatchObject({ status: "ready", syncStatus: "synced" });

    act(() => mocks.listeners[0]?.next(snapshot([cardDocument("replacement", { frontText: "Current" })])));

    expect(result.current.cards).toEqual([expect.objectContaining({ id: "replacement", frontText: "Current" })]);
    act(stop);
  });

  it.each([
    [{ fromCache: true, hasPendingWrites: false }, "cached"],
    [{ fromCache: true, hasPendingWrites: true }, "pending"],
    [{ fromCache: false, hasPendingWrites: false }, "synced"],
  ] as const)("reports %s metadata as %s", (metadata, syncStatus) => {
    const { result } = renderCardState();
    const stop = startCardSync();

    act(() => mocks.listeners[0]?.next(snapshot([], metadata)));

    expect(result.current.read.syncStatus).toBe(syncStatus);
    act(stop);
  });

  it("publishes parse failures to the existing error and retry contract", () => {
    const { result } = renderCardState();
    const stop = startCardSync();

    act(() => mocks.listeners[0]?.next(snapshot([cardDocument("invalid", { nextSeeingAt: null })])));

    expect(result.current.read.status).toBe("error");
    expect(result.current.read.error).toEqual(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
    expect(mocks.listeners[0]?.unsubscribe).toHaveBeenCalledOnce();

    act(() => result.current.read.retry());

    expect(result.current.read.status).toBe("loading");
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(2);
    act(() => mocks.listeners[1]?.next(snapshot([cardDocument("valid")])));
    expect(result.current.read.status).toBe("ready");
    expect(result.current.cards).toEqual([expect.objectContaining({ id: "valid" })]);
    act(stop);
  });

  it("publishes listener failures to the existing error contract", () => {
    const { result } = renderCardState();
    const stop = startCardSync();
    const error = new Error("listener failed");

    act(() => mocks.listeners[0]?.error(error));

    expect(result.current.read).toMatchObject({ status: "error", error });
    act(stop);
  });

  it("unsubscribes, resets read state, and ignores late callbacks when stopped", () => {
    const { result } = renderCardState();
    const stop = startCardSync();
    const previousListener = mocks.listeners[0];
    act(() => previousListener?.next(snapshot([cardDocument("old")])));
    expect(result.current.cards).toHaveLength(1);

    act(stop);

    expect(previousListener?.unsubscribe).toHaveBeenCalledOnce();
    expect(result.current.read.status).toBe("idle");
    expect(result.current.cards).toEqual([expect.objectContaining({ id: "old" })]);
    act(clearCards);
    act(() => previousListener?.next(snapshot([cardDocument("late")])));
    expect(result.current.cards).toEqual([]);
  });
});
