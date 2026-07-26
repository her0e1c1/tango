import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/adapters/firestore/deck", () => ({
  create: mocks.create,
  update: mocks.update,
  remove: mocks.remove,
}));

import { deckCommands } from "@/services/deckCommands";

const createDeck = (overrides: Partial<Deck> = {}) => createDeckFixture({ uid: "uid-a", ...overrides });

describe("deck commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("created");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("rejects missing users and mismatched owners before writing", async () => {
    await expect(deckCommands.create("", createDeck())).rejects.toThrow("confirmed user");
    await expect(deckCommands.remove("uid-a", createDeck({ uid: "uid-b" }))).rejects.toThrow("owner does not match");

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("serializes writes to the same Deck", async () => {
    let finishUpdate!: () => void;
    mocks.update.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishUpdate = resolve;
      })
    );
    const deck = createDeck({ id: "deck" });

    const update = deckCommands.update("uid-a", deck);
    const remove = deckCommands.remove("uid-a", deck);
    await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.remove).not.toHaveBeenCalled();

    finishUpdate();
    await Promise.all([update, remove]);
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a");
  });

  it("allows writes to unrelated Decks to proceed independently", async () => {
    let finishFirst!: () => void;
    mocks.update.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );
    const first = createDeck({ id: "first" });
    const second = createDeck({ id: "second" });

    const firstUpdate = deckCommands.update("uid-a", first);
    const secondUpdate = deckCommands.update("uid-a", second);
    await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));

    finishFirst();
    await Promise.all([firstUpdate, secondUpdate]);
  });
});
