import type { Card } from "@/entities/card";

import { describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import { upsertImportedCards } from "./upsertImportedCards";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });
const writers = {
  createCard: () => Promise.resolve(),
  editCard: () => Promise.resolve(),
};

describe("upsertImportedCards", () => {
  it("rejects missing users and Cards owned by another user", async () => {
    await expect(upsertImportedCards("", [createCard()], [], writers)).rejects.toThrow("confirmed user");
    await expect(upsertImportedCards("uid-a", [createCard({ uid: "uid-b" })], [], writers)).rejects.toThrow(
      "owner does not match"
    );
  });

  it("routes planned creates to createCard and existing Cards to editCard", async () => {
    const created = createCard({ id: "created" });
    const existing = createCard({ id: "existing" });
    const createCardWriter = vi.fn().mockResolvedValue(undefined);
    const editCardWriter = vi.fn().mockResolvedValue(undefined);

    await upsertImportedCards("uid-a", [created, existing], [created.id], {
      createCard: createCardWriter,
      editCard: editCardWriter,
    });

    expect(createCardWriter).toHaveBeenCalledWith("uid-a", created);
    expect(editCardWriter).toHaveBeenCalledWith("uid-a", existing);
  });
});
