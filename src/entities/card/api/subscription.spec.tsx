import { act, renderHook } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "../model/hooks";
import { clearCards } from "../model/store";

type TestDocument = { id: string; data: () => Record<string, unknown> };
type TestSnapshot = {
  docs: TestDocument[];
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

import { subscribeCards } from "./firestore";

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

const metadata = { fromCache: false, hasPendingWrites: false };

describe("Card Firestore subscription", () => {
  beforeEach(() => {
    clearCards();
    vi.clearAllMocks();
    mocks.next = undefined;
    mocks.error = undefined;
  });

  it("subscribes by UID and fully replaces active Cards from each snapshot", () => {
    const onData = vi.fn();
    const { result } = renderHook(useCards);
    const unsubscribe = subscribeCards("uid-a", vi.fn(), onData);

    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    expect(mocks.onSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      { includeMetadataChanges: true },
      expect.any(Function),
      expect.any(Function)
    );

    act(() =>
      mocks.next?.({
        metadata,
        docs: [
          cardDocument("active", {
            lastSeenAt: 50,
            nextSeeingAt: Timestamp.fromMillis(60),
            interval: 7,
            url: "https://example.com/card",
            startLine: 8,
            endLine: 9,
          }),
          cardDocument("deleted", { deletedAt: 3 }),
        ],
      })
    );

    expect(result.current).toEqual([
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
    expect(onData).toHaveBeenCalledWith({ serverConfirmed: true });

    act(() => mocks.next?.({ metadata, docs: [cardDocument("replacement", { frontText: "Current" })] }));
    expect(result.current).toEqual([expect.objectContaining({ id: "replacement", frontText: "Current" })]);

    unsubscribe();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("evaluates serverConfirmed from Firestore snapshot metadata", () => {
    const onData = vi.fn();
    subscribeCards("uid-a", vi.fn(), onData);

    act(() =>
      mocks.next?.({
        metadata: { fromCache: true, hasPendingWrites: false },
        docs: [],
      })
    );
    expect(onData).toHaveBeenNthCalledWith(1, { serverConfirmed: false });

    act(() =>
      mocks.next?.({
        metadata: { fromCache: false, hasPendingWrites: true },
        docs: [],
      })
    );
    expect(onData).toHaveBeenNthCalledWith(2, { serverConfirmed: false });

    act(() =>
      mocks.next?.({
        metadata: { fromCache: false, hasPendingWrites: false },
        docs: [],
      })
    );
    expect(onData).toHaveBeenNthCalledWith(3, { serverConfirmed: true });
  });

  it("reports invalid Firestore documents", () => {
    const onError = vi.fn();
    subscribeCards("uid-a", onError);

    act(() => mocks.next?.({ metadata, docs: [cardDocument("invalid", { nextSeeingAt: null })] }));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
  });

  it("reports Firestore subscription errors", () => {
    const onError = vi.fn();
    const error = new Error("listener failed");
    subscribeCards("uid-a", onError);

    mocks.error?.(error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
