import { describe, expect, it } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

import { createDeck } from "../index";

describe("createDeck", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  it("rejects missing users and mismatched owners", async () => {
    await expect(createDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(createDeck("uid-b", deck)).rejects.toThrow("owner does not match");
  });
});
