import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { editDeck } from "./editDeck";

describe("editDeck", () => {
  it("rejects an edit without a confirmed user", async () => {
    await expect(editDeck("", { id: "deck" })).rejects.toThrow("confirmed user");
  });
});
