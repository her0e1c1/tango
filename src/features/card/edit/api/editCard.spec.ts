import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({ updateCardDocument: vi.fn() }));
vi.mock("./firestore", () => ({ updateCardDocument: mocks.updateCardDocument }));

import { editCard } from "./editCard";

const card = createCardFixture({ id: "card", uid: "uid-a" });

describe("editCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateCardDocument.mockResolvedValue(undefined);
  });

  it("rejects missing users", async () => {
    await expect(editCard("", card)).rejects.toThrow("confirmed user");
  });

  it("passes only ordinary editable fields to the write adapter", async () => {
    const untrustedInput = { ...card, frontText: "Updated", deckId: "other", score: 99 } as unknown as Parameters<
      typeof editCard
    >[1];
    await editCard("uid-a", untrustedInput);

    expect(mocks.updateCardDocument).toHaveBeenCalledWith({
      id: card.id,
      frontText: "Updated",
      backText: card.backText,
      tags: card.tags,
      uniqueKey: card.uniqueKey,
    });
  });
});
