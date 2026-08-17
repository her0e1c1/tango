import { describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { createDeck, deleteDeck, editDeck } from "./firestore";

describe("Deck Firestore persistence", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  it("rejects remote creation without a confirmed actor or with a local command", async () => {
    await expect(createDeck("", { id: "deck", name: "Deck" })).rejects.toThrow("confirmed user");
    await expect(createDeck("uid-a", { id: "deck", name: "Deck", localMode: true })).rejects.toThrow("local mode");
  });

  it("rejects edits without a confirmed matching owner", async () => {
    await expect(editDeck("", deck, { id: deck.id })).rejects.toThrow("confirmed user");
    await expect(editDeck("uid-b", deck, { id: deck.id })).rejects.toThrow("owner does not match");
  });

  it("rejects deletes without a confirmed matching owner", async () => {
    await expect(deleteDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(deleteDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });
});
