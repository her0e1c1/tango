import { describe, expect, it } from "vitest";

import { editDeck } from "./editDeck";

describe("editDeck", () => {
  it("rejects an edit without a confirmed user", async () => {
    await expect(editDeck("", { id: "deck" })).rejects.toThrow("confirmed user");
  });
});
