import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: mocks.httpsCallable.mockReturnValue(mocks.request),
}));
vi.mock("@/shared/firebase", () => ({ functions: "functions" }));

import { deleteDeck } from "./deleteDeck";

describe("deleteDeck", () => {
  beforeEach(() => {
    mocks.request.mockReset();
    mocks.request.mockResolvedValue({ data: { status: "completed", deletedCards: 2 } });
  });

  it("requests trusted server deletion without sending an owner identity", async () => {
    await deleteDeck("deck-id");

    expect(mocks.httpsCallable).toHaveBeenCalledExactlyOnceWith("functions", "deleteDeck");
    expect(mocks.request).toHaveBeenCalledExactlyOnceWith({ deckId: "deck-id" });
  });
});
