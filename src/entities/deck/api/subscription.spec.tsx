import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDecks } from "../model/hooks";
import { clearDecks } from "../model/store";

type TestDocument = { id: string; data: () => Record<string, unknown> };
type TestSnapshot = { docs: TestDocument[] };

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
  next: undefined as ((snapshot: TestSnapshot) => void) | undefined,
  error: undefined as ((error: Error) => void) | undefined,
  unsubscribe: vi.fn(),
  onSnapshot: vi.fn((_query: unknown, next: (snapshot: TestSnapshot) => void, error: (cause: Error) => void) => {
    mocks.next = next;
    mocks.error = error;
    return mocks.unsubscribe;
  }),
}));

vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  collection: mocks.collection,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  where: mocks.where,
}));
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { subscribeDecks } from "./firestore";

const deckDocument = (id: string, overrides: Record<string, unknown> = {}): TestDocument => ({
  id,
  data: () => ({
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
  }),
});

describe("Deck Firestore subscription", () => {
  beforeEach(() => {
    clearDecks();
    vi.clearAllMocks();
    mocks.next = undefined;
    mocks.error = undefined;
  });

  it("subscribes by UID and fully replaces active Decks from each snapshot", () => {
    const { result } = renderHook(useDecks);
    const unsubscribe = subscribeDecks("uid-a", vi.fn());

    expect(mocks.collection).toHaveBeenCalledWith("db", "deck");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
    act(() =>
      mocks.next?.({
        docs: [deckDocument("active", { url: "https://example.com" }), deckDocument("deleted", { deletedAt: 3 })],
      })
    );

    expect(result.current).toEqual([expect.objectContaining({ id: "active", url: "https://example.com" })]);

    act(() => mocks.next?.({ docs: [deckDocument("replacement", { name: "Current" })] }));
    expect(result.current).toEqual([expect.objectContaining({ id: "replacement", name: "Current" })]);

    unsubscribe();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("reports invalid Firestore documents", () => {
    const onError = vi.fn();
    subscribeDecks("uid-a", onError);

    act(() => mocks.next?.({ docs: [deckDocument("invalid", { selectedTags: [42] })] }));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "FirestoreDocumentValidationError", documentId: "invalid" })
    );
  });

  it("reports Firestore subscription errors", () => {
    const onError = vi.fn();
    const error = new Error("subscription failed");
    subscribeDecks("uid-a", onError);

    mocks.error?.(error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
