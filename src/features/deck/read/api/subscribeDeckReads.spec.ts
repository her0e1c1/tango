import type { Deck } from "@/entities/deck";

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
vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getDb: () => "db",
  subscribeReads: mocks.subscribeReads,
}));

import { subscribeDeckReads } from "./subscribeDeckReads";

interface CapturedOptions {
  query: unknown;
  mapDocument: (id: string, data: unknown) => Deck;
  isActive: (deck: Deck) => boolean;
  onSnapshot: RemoteSubscriptionProps<Deck>["onSnapshot"];
  onError: RemoteSubscriptionProps<Deck>["onError"];
}

const deckDocument = (deletedAt: number | null = null) => ({
  name: "Remote Deck",
  isPublic: false,
  uid: "uid-a",
  createdAt: 1,
  updatedAt: 2,
  deletedAt,
  scoreMax: null,
  scoreMin: null,
  selectedTags: [],
  tagAndFilter: false,
  category: "",
  convertToBr: false,
});

describe("subscribeDeckReads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribeReads.mockReturnValue(mocks.unsubscribe);
  });

  it("constructs a UID-scoped Deck query and forwards callbacks", () => {
    const props: RemoteSubscriptionProps<Deck> = {
      uid: "uid-a",
      onSnapshot: vi.fn(),
      onError: vi.fn(),
    };

    expect(subscribeDeckReads(props)).toBe(mocks.unsubscribe);
    expect(mocks.collection).toHaveBeenCalledWith("db", "deck");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");

    const options = mocks.subscribeReads.mock.calls[0]?.[0] as CapturedOptions;
    expect(options.query).toEqual([
      ["db", "deck"],
      ["uid", "==", "uid-a"],
    ]);
    expect(options.onSnapshot).toBe(props.onSnapshot);
    expect(options.onError).toBe(props.onError);
  });

  it("owns Deck mapping and active soft-delete policy", () => {
    subscribeDeckReads({ uid: "uid-a", onSnapshot: vi.fn(), onError: vi.fn() });

    const options = mocks.subscribeReads.mock.calls[0]?.[0] as CapturedOptions;
    const active = options.mapDocument("active", deckDocument());
    const deleted = options.mapDocument("deleted", deckDocument(3));

    expect(active).toEqual(expect.objectContaining({ id: "active", deletedAt: null }));
    expect(options.isActive(active)).toBe(true);
    expect(options.isActive(deleted)).toBe(false);
  });
});
