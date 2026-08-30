import { describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture, createRemoteDeckInput } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { createDeck, deleteDeck, editDeck } from "./firestore";

describe("Deck Firestore persistence", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  it("rejects create requests without a confirmed actor", async () => {
    await expect(createDeck("", createRemoteDeckInput({ id: deck.id }))).rejects.toThrow("confirmed user");
  });

  it("rejects edit requests without a confirmed user", async () => {
    await expect(editDeck("", { id: deck.id })).rejects.toThrow("confirmed user");
  });

  it("rejects delete requests without a confirmed user or Deck id", async () => {
    await expect(deleteDeck("", deck.id)).rejects.toThrow("confirmed user");
    await expect(deleteDeck(deck.uid, "")).rejects.toThrow("Deck id");
  });
});
