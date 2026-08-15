import { describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  db: {},
}));

import { createDeck, deleteDeck, editDeck } from "./firestore";

describe("Deck Firestore persistence", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  it("rejects create requests without a confirmed matching owner", async () => {
    await expect(createDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(createDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });

  it("rejects edit requests without a confirmed user", async () => {
    await expect(editDeck("", { id: deck.id })).rejects.toThrow("confirmed user");
  });

  it("rejects delete requests without a confirmed matching owner", async () => {
    await expect(deleteDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(deleteDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });
});
