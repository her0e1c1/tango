import { createDeck } from "@/test/factories";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "../model/queries/useCards";
import { cardStore } from "../model/store";

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
vi.mock("@/entities/deck/@x/card", () => ({
  getDecks: () => [createDeck({ id: "deck-a", uid: "uid-a" })],
  useDecks: () => [createDeck({ id: "deck-a", uid: "uid-a" })],
}));
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { subscribeCards } from "./firestore";

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
    fsrs: null,
    deletedAt: null,
    ...overrides,
  }),
});

// Returns the snapshot callback registered by the Card subscription.
const getSnapshotHandler = () =>
  mocks.onSnapshot.mock.calls[0]?.[1] as (snapshot: { docs: ReturnType<typeof cardDocument>[] }) => void;
// Returns the error callback registered by the Card subscription.
const getErrorHandler = () => mocks.onSnapshot.mock.calls[0]?.[2] as (error: Error) => void;

describe("Card Firestore subscription [CARD-VIEW-01]", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [] });
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(vi.fn());
  });

  it("fully replaces active Cards from each snapshot", () => {
    const { result } = renderHook(useCards);
    subscribeCards("uid-a", vi.fn());

    act(() =>
      getSnapshotHandler()({
        docs: [
          cardDocument("active", {
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
        frontText: "Remote front",
        tags: ["science"],
        url: "https://example.com/card",
        startLine: 8,
        endLine: 9,
      }),
    ]);

    act(() => getSnapshotHandler()({ docs: [cardDocument("replacement", { frontText: "Current" })] }));
    expect(result.current).toEqual([expect.objectContaining({ id: "replacement", frontText: "Current" })]);
  });

  it("reports invalid Firestore documents", () => {
    const onError = vi.fn();
    subscribeCards("uid-a", onError);

    act(() => getSnapshotHandler()({ docs: [cardDocument("invalid", { tags: null })] }));

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
