import { act, renderHook } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLocalCard } from "@/test/factories";
import { useCards } from "../model/hooks";
import { cardStore } from "../model/store";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  getDocsFromServer: vi.fn(),
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
    getDocsFromServer: mocks.getDocsFromServer,
    onSnapshot: mocks.onSnapshot,
    query: mocks.query,
    where: mocks.where,
  };
});
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { fetchCardReads, fetchCards, subscribeCardReads, subscribeCards } from "./firestore";

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
  mocks.onSnapshot.mock.calls[0]?.[1] as (snapshot: { docs: ReturnType<typeof cardDocument>[] }) => void;
const getErrorHandler = () => mocks.onSnapshot.mock.calls[0]?.[2] as (error: Error) => void;

describe("Card Firestore subscription", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [], localCards: [] });
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(mocks.unsubscribe);
  });

  it("fetches the same separated read contract as subscriptions", async () => {
    mocks.getDocsFromServer.mockResolvedValue({
      docs: [cardDocument("active"), cardDocument("deleted", { deletedAt: 3 })],
    });

    await expect(fetchCardReads("uid-a")).resolves.toEqual([
      {
        card: expect.objectContaining({ id: "active", frontText: "Remote front" }),
        progress: expect.objectContaining({ cardId: "active", score: 3, numberOfSeen: 4 }),
      },
    ]);
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
  });

  it("keeps combined Card fetches behind the compatibility API", async () => {
    mocks.getDocsFromServer.mockResolvedValue({
      docs: [cardDocument("active", { nextSeeingAt: Timestamp.fromMillis(60) })],
    });

    await expect(fetchCards("uid-a")).resolves.toEqual([
      expect.objectContaining({
        id: "active",
        score: 3,
        numberOfSeen: 4,
        nextSeeingAt: new Date(60),
      }),
    ]);
  });

  it("exposes separate Card and StudyProgress reads from each snapshot", () => {
    const onReads = vi.fn();
    const unsubscribe = subscribeCardReads("uid-a", onReads, vi.fn());

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

    unsubscribe();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("subscribes by UID and fully replaces active Cards from each snapshot", () => {
    const localCard = createLocalCard({ id: "local", frontText: "Local front" });
    cardStore.setState({ localCards: [localCard] });
    const { result } = renderHook(useCards);
    const unsubscribe = subscribeCards("uid-a", vi.fn());

    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    expect(mocks.onSnapshot).toHaveBeenCalledWith(expect.anything(), expect.any(Function), expect.any(Function));

    act(() =>
      getSnapshotHandler()({
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
      localCard,
    ]);

    act(() => getSnapshotHandler()({ docs: [cardDocument("replacement", { frontText: "Current" })] }));
    expect(result.current).toEqual([expect.objectContaining({ id: "replacement", frontText: "Current" }), localCard]);

    unsubscribe();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
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
