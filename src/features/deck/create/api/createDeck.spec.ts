import type { Deck } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({ createDeckDocument: vi.fn() }));

vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  createDeckDocument: mocks.createDeckDocument,
}));

import { createDeck } from "../index";

describe("createDeck", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" }) as Deck;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createDeckDocument.mockResolvedValue(deck.id);
  });

  it("creates an owned Deck", async () => {
    await createDeck("uid-a", deck);
    expect(mocks.createDeckDocument).toHaveBeenCalledExactlyOnceWith(deck);
  });

  it("rejects missing users and mismatched owners before writing", async () => {
    await expect(createDeck("", deck)).rejects.toThrow("confirmed user");
    await expect(createDeck("uid-b", deck)).rejects.toThrow("owner does not match");
    expect(mocks.createDeckDocument).not.toHaveBeenCalled();
  });
});
