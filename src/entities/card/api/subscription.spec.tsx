import { act, renderHook } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "../model/hooks";
import { clearCards } from "../model/store";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  onSnapshot: vi.fn(),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
  unsubscribe: vi.fn(),
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
vi.mock("@/shared/api", () => ({ db: "db" }));

import { subscribeCards } from "./firestore";

const cardDocument = (id: string, overrides: Record<string, unknown> = {}) => ({
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

const getSnapshotHandler = () =>
  mocks.onSnapshot.mock.calls[0]?.[2] as (snapshot: {
    metadata: { fromCache: boolean; hasPendingWrites: boolean };
    docs: ReturnType<typeof cardDocument>[];
  }) => void;
const getErrorHandler = () => mocks.onSnapshot.mock.calls[0]?.[3] as (error: Error) => void;

describe("Card Firestore subscription", () => {
  beforeEach(() => {
    clearCards();
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(mocks.unsubscribe);
  });

  it("subscribes by UID and fully replaces active Cards from each snapshot", () => {
    const { result } = renderHook(useCards);
    const unsubscribe = subscribeCards("uid-a", vi.fn());

    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    expect(mocks.onSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      { includeMetadataChanges: true },
      expect.any(Function),
      expect.any(Function)
    );

    act(() =>
      getSnapshotHandler()({
        metadata: { fromCache: false, hasPendingWrites: false },
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

    act(() =>
      getSnapshotHandler()({
        metadata: { fromCache: false, hasPendingWrites: false },
        docs: [cardDocument("replacement", { frontText: "Current" })],
      })
    );
    expect(result.current).toEqual([expect.objectContaining({ id: "replacement", frontText: "Current" })]);

    unsubscribe();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("reports invalid Firestore documents", () => {
    const onError = vi.fn();
    subscribeCards("uid-a", onError);

    act(() =>
      getSnapshotHandler()({
        metadata: { fromCache: false, hasPendingWrites: false },
        docs: [cardDocument("invalid", { nextSeeingAt: null })],
      })
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
  });

  it("reports Firestore subscription errors", () => {
    const onError = vi.fn();
    const error = new Error("listener failed");
    subscribeCards("uid-a", onError);

    getErrorHandler()(error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
