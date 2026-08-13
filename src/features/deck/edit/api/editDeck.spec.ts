import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ updateDeckDocument: vi.fn() }));

vi.mock("./firestore", () => ({
  updateDeckDocument: mocks.updateDeckDocument,
}));

import { editDeck } from "./editDeck";

describe("editDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateDeckDocument.mockResolvedValue(undefined);
  });

  it("updates a Deck without ownership metadata in the edit", async () => {
    const edit = { id: "deck", name: "Updated" };
    await editDeck("uid-a", edit);
    expect(mocks.updateDeckDocument).toHaveBeenCalledExactlyOnceWith(edit);
  });

  it("rejects a missing user before writing", async () => {
    await expect(editDeck("", { id: "deck" })).rejects.toThrow("confirmed user");
    expect(mocks.updateDeckDocument).not.toHaveBeenCalled();
  });
});
