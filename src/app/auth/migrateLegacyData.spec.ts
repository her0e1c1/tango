import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeck } from "@/test/factories";

const storage = vi.hoisted(() => ({ save: vi.fn(), documents: new Map<string, Record<string, unknown>>() }));
vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/shared/firestore-write", () => ({
  writeLocally: (_uid: string, _refs: unknown[], write: () => Promise<void>) => write(),
}));
vi.mock("firebase/firestore", async (original) => ({
  ...(await original<typeof import("firebase/firestore")>()),
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  writeBatch: () => {
    const documents = new Map<string, Record<string, unknown>>();
    return {
      set: (path: string, value: Record<string, unknown>) => documents.set(path, value),
      commit: async () => {
        await storage.save();
        for (const [path, value] of documents) storage.documents.set(path, value);
      },
    };
  },
}));
import { migrateLegacyData } from "./migrateLegacyData";

describe("Legacy migration ownership [DECK-07]", () => {
  beforeEach(() => {
    localStorage.clear();
    storage.documents.clear();
    storage.save.mockReset().mockResolvedValue(undefined);
  });
  it("converts an owner-free legacy session into an owned Firestore session", async () => {
    localStorage.setItem(
      "tango-local-decks",
      JSON.stringify({ version: 0, state: { localDecks: [createDeck({ id: "deck" })] } })
    );
    localStorage.setItem(
      "tango-study",
      JSON.stringify({
        version: 0,
        state: {
          sessionsByDeckId: {
            deck: {
              sessionId: "session",
              deckId: "deck",
              cardOrderIds: ["card"],
              currentIndex: 0,
              lastStudiedAt: 1000,
            },
          },
        },
      })
    );
    await migrateLegacyData("owner");
    expect(storage.documents.get("studySession/owner-legacy-session")).toMatchObject({
      uid: "owner",
      deckId: "owner-legacy-deck",
      cardOrderIds: ["owner-legacy-card"],
      currentIndex: 0,
      startedAt: expect.objectContaining({ seconds: 1, nanoseconds: 0 }),
    });
  });
  it("keeps an interrupted migration assigned to its first UID through account switching and retry", async () => {
    const decks = Array.from({ length: 21 }, (_, index) => createDeck({ id: `deck-${String(index)}` }));
    const original = JSON.stringify({ version: 0, state: { localDecks: decks } });
    localStorage.setItem("tango-local-decks", original);
    const first = Promise.withResolvers<void>();
    storage.save.mockReturnValueOnce(first.promise).mockRejectedValueOnce(new Error("storage failed"));
    const migration = migrateLegacyData("first-user");
    const failure = migration.catch((error: unknown) => error);
    await migrateLegacyData("second-user");
    first.resolve();
    expect(await failure).toEqual(new Error("storage failed"));
    await migrateLegacyData("second-user");
    expect(storage.documents.size).toBe(20);
    expect([...storage.documents.values()].every((value) => value.uid === "first-user")).toBe(true);
    await migrateLegacyData("first-user");
    expect(storage.documents.size).toBe(21);
    expect(localStorage.getItem("tango-firestore-migrated")).toBe("first-user");
    expect(localStorage.getItem("tango-local-decks")).toBe(original);
  });
});
