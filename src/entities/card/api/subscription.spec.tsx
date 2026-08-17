import { act } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  onSnapshot: vi.fn(),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
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

import { subscribeCardReads } from "./firestore";

// Builds a Firestore-like Card document with optional field overrides.
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

// Returns the snapshot callback registered by the Card subscription.
const getSnapshotHandler = () =>
  mocks.onSnapshot.mock.calls[0]?.[1] as (snapshot: { docs: ReturnType<typeof cardDocument>[] }) => void;
// Returns the error callback registered by the Card subscription.
const getErrorHandler = () => mocks.onSnapshot.mock.calls[0]?.[2] as (error: Error) => void;

describe("Card Firestore subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(vi.fn());
  });

  it("exposes separate Card and StudyProgress reads from each snapshot", () => {
    const onReads = vi.fn();
    subscribeCardReads("uid-a", onReads, vi.fn());

    act(() =>
      getSnapshotHandler()({
        docs: [
          cardDocument("active", {
            lastSeenAt: 50,
            nextSeeingAt: Timestamp.fromMillis(60),
            interval: 7,
            url: "https://example.com/card",
          }),
          cardDocument("deleted", { deletedAt: 3 }),
        ],
      })
    );

    expect(onReads).toHaveBeenCalledExactlyOnceWith([
      {
        card: {
          id: "active",
          frontText: "Remote front",
          backText: "Remote back",
          tags: ["science"],
          uniqueKey: "key-active",
          deckId: "deck-a",
          uid: "uid-a",
          createdAt: 1,
          updatedAt: 2,
          deletedAt: null,
          url: "https://example.com/card",
        },
        progress: {
          cardId: "active",
          score: 3,
          numberOfSeen: 4,
          lastSeenAt: 50,
          nextSeeingAt: new Date(60),
          interval: 7,
        },
      },
    ]);
  });

  it("reports invalid Firestore documents", () => {
    const onError = vi.fn();
    subscribeCardReads("uid-a", vi.fn(), onError);

    act(() => getSnapshotHandler()({ docs: [cardDocument("invalid", { nextSeeingAt: null })] }));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
  });

  it("reports Firestore subscription errors", () => {
    const onError = vi.fn();
    const error = new Error("listener failed");
    subscribeCardReads("uid-a", vi.fn(), onError);

    getErrorHandler()(error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
