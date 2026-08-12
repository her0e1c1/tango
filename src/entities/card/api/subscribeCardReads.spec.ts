import type { Card } from "../model/card";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RemoteSubscriptionProps } from "@/shared/api";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
  subscribeReads: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  query: mocks.query,
  where: mocks.where,
}));
vi.mock("@/shared/firebase/firestore-runtime", () => ({ getDb: () => "db" }));
vi.mock("@/shared/firebase/subscribeReads", () => ({ subscribeReads: mocks.subscribeReads }));

import { subscribeCardReads } from "./subscribeCardReads";

interface CapturedOptions {
  query: unknown;
  mapDocument: (id: string, data: unknown) => Card;
  isActive: (card: Card) => boolean;
  onSnapshot: RemoteSubscriptionProps<Card>["onSnapshot"];
  onError: RemoteSubscriptionProps<Card>["onError"];
}

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

describe("subscribeCardReads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribeReads.mockReturnValue(mocks.unsubscribe);
  });

  it("constructs a UID-scoped Card query and forwards callbacks", () => {
    const props: RemoteSubscriptionProps<Card> = {
      uid: "uid-a",
      onSnapshot: vi.fn(),
      onError: vi.fn(),
    };

    expect(subscribeCardReads(props)).toBe(mocks.unsubscribe);
    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");

    const options = mocks.subscribeReads.mock.calls[0]?.[0] as CapturedOptions;
    expect(options.query).toEqual([
      ["db", "card"],
      ["uid", "==", "uid-a"],
    ]);
    expect(options.onSnapshot).toBe(props.onSnapshot);
    expect(options.onError).toBe(props.onError);
  });

  it("owns Card mapping and active soft-delete policy", () => {
    subscribeCardReads({ uid: "uid-a", onSnapshot: vi.fn(), onError: vi.fn() });

    const options = mocks.subscribeReads.mock.calls[0]?.[0] as CapturedOptions;
    const active = options.mapDocument("active", cardDocument());
    const deleted = options.mapDocument("deleted", cardDocument(3));

    expect(active).toEqual(expect.objectContaining({ id: "active", deletedAt: null }));
    expect(options.isActive(active)).toBe(true);
    expect(options.isActive(deleted)).toBe(false);
  });
});
