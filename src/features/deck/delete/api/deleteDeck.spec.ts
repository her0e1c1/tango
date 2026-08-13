import { describe, expect, it } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

import { deleteDeck } from "./deleteDeck";

describe("deleteDeck", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  it("rejects missing users and mismatched owners", async () => {
    await expect(deleteDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(deleteDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });
});
