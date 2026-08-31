import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  doc: vi.fn((...parts: unknown[]) => parts),
  getDocFromServer: vi.fn(),
  getDocsFromServer: vi.fn(),
  query: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: mocks.doc,
  getDocFromServer: mocks.getDocFromServer,
  getDocsFromServer: mocks.getDocsFromServer,
  onSnapshot: vi.fn(),
  query: mocks.query,
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}));
vi.mock("@/shared/firebase", () => ({ db: "db" }));

import { fetchRemoteCardRead } from "./firestore";

const cardDocument = (overrides: Record<string, unknown> = {}) => ({
  frontText: "Front",
  backText: "Back",
  tags: [],
  uniqueKey: "key-card",
  deckId: "deck-a",
  uid: "uid-a",
  createdAt: 1,
  updatedAt: 2,
  deletedAt: null,
  score: 3,
  numberOfSeen: 4,
  ...overrides,
});

const resolveDocument = (value: unknown) => {
  mocks.getDocFromServer.mockResolvedValue({ exists: () => true, data: () => value });
};

describe("SWIPE-27 SWIPE-28 single remote Card read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns one separated active Card read without querying the collection", async () => {
    resolveDocument(cardDocument({ lastSeenAt: 5 }));

    await expect(fetchRemoteCardRead("uid-a", "card-a")).resolves.toEqual({
      status: "active",
      read: {
        card: expect.objectContaining({ id: "card-a", deckId: "deck-a", uid: "uid-a" }),
        progress: expect.objectContaining({ cardId: "card-a", score: 3, numberOfSeen: 4, lastSeenAt: 5 }),
      },
    });
    expect(mocks.doc).toHaveBeenCalledWith("db", "card", "card-a");
    expect(mocks.getDocsFromServer).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("distinguishes a missing document from a tombstone", async () => {
    mocks.getDocFromServer.mockResolvedValueOnce({ exists: () => false });
    await expect(fetchRemoteCardRead("uid-a", "missing")).resolves.toEqual({ status: "missing" });

    resolveDocument(cardDocument({ deletedAt: 3 }));
    await expect(fetchRemoteCardRead("uid-a", "deleted")).resolves.toEqual({ status: "tombstoned" });
  });

  it("rejects owner mismatches and malformed physical documents", async () => {
    resolveDocument(cardDocument({ uid: "uid-b" }));
    await expect(fetchRemoteCardRead("uid-a", "foreign")).rejects.toThrow("owner does not match");

    resolveDocument(cardDocument({ tags: [42] }));
    await expect(fetchRemoteCardRead("uid-a", "invalid")).rejects.toThrow('Invalid Firestore card document "invalid"');
  });
});
