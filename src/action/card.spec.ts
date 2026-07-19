import { expect, it, describe, vi, beforeEach } from "vitest";

import * as card from "@/action/card";
import { createCard, createDeck } from "@/test/factories";

vi.mock("./firestore");
vi.mock("@/firebase", () => ({ auth: { currentUser: null } }));
vi.mock("@/auth/AuthContext", () => ({ publishAuthenticatedUser: vi.fn() }));
vi.mock("firebase/firestore", () => ({
  ...Object.fromEntries(Object.keys(vi.importActual("firebase/firestore")).map((key) => [key, vi.fn()])),
  getFirestore: vi.fn(() => "db"),
}));

describe("card action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("prepares a card with an injected id", () => {
    const prepared = card.prepare(
      { frontText: "front", backText: "back", tags: [], uniqueKey: "key" },
      createDeck({ id: "deck-id", uid: "uid-a" }),
      () => "card-id"
    );

    expect(prepared).toMatchObject({ id: "card-id", deckId: "deck-id", uid: "uid-a" });
  });

  describe.concurrent("fromRow", () => {
    it("should be fromRow", async () => {
      const c = { frontText: "front", backText: "back", tags: ["a", "b", "c"], uniqueKey: "123" } as Card;
      expect(card.fromRow(["front", "back", "a,b,c", "123"])).toEqual(c);
    });
    it("should be empty", async () => {
      const c = { frontText: "", backText: "", tags: [], uniqueKey: "" } satisfies CardRaw;
      expect(card.fromRow([])).toEqual(c);
    });
  });

  describe.concurrent("toRow", () => {
    it("should be toRow", async () => {
      const c = { frontText: "front", backText: "back", tags: ["a", "b", "c"], uniqueKey: "123" } as Card;
      expect(card.toRow(c)).toEqual(["front", "back", "a,b,c", "123"]);
    });
    it("should be empty", async () => {
      const c = createCard({ frontText: "", backText: "", tags: [], uniqueKey: "" });
      expect(card.toRow(c)).toEqual(["", "", "", ""]);
    });
  });
});
