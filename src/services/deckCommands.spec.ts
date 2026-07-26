import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REMOTE_WRITE_TIMEOUT_MS } from "@/services/remoteWrite";
import { createCard as createCardFixture, createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

const cardMocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/adapters/firestore/deck", () => ({
  create: mocks.create,
  update: mocks.update,
  remove: mocks.remove,
}));

vi.mock("@/adapters/firestore/card", () => ({
  create: cardMocks.create,
  update: cardMocks.update,
  logicalRemove: cardMocks.logicalRemove,
  upsert: cardMocks.upsert,
}));

import { cardCommands } from "@/services/cardCommands";
import { deckCommands } from "@/services/deckCommands";

const createDeck = (overrides: Partial<Deck> = {}) => createDeckFixture({ uid: "uid-a", ...overrides });
const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });

describe("deck commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("created");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
    cardMocks.create.mockResolvedValue("created");
    cardMocks.update.mockResolvedValue(undefined);
    cardMocks.logicalRemove.mockResolvedValue(undefined);
    cardMocks.upsert.mockResolvedValue("upserted");
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it.each([
    ["create", "Deck creation"],
    ["update", "Deck update"],
    ["remove", "Deck deletion"],
  ] as const)("rejects a stalled Deck %s instead of leaving it pending", async (command, label) => {
    vi.useFakeTimers();
    mocks[command].mockReturnValueOnce(new Promise(() => undefined));
    const operation = deckCommands[command]("uid-a", createDeck({ id: `stalled-${command}` }));
    const assertion = expect(operation).rejects.toThrow(`${label} did not finish`);

    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);

    await assertion;
  });

  it("waits to write a Card while its Deck is being removed", async () => {
    let finishRemoval!: () => void;
    mocks.remove.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishRemoval = resolve;
      })
    );
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });

    const removal = deckCommands.remove("uid-a", deck);
    await vi.waitFor(() => expect(mocks.remove).toHaveBeenCalledOnce());
    const cardWrite = cardCommands.create("uid-a", card);
    await Promise.resolve();
    expect(cardMocks.create).not.toHaveBeenCalled();

    finishRemoval();
    await Promise.all([removal, cardWrite]);
    expect(cardMocks.create).toHaveBeenCalledExactlyOnceWith(card);
  });

  it("waits to remove a Deck while one of its Cards is being written", async () => {
    let finishCardWrite!: () => void;
    cardMocks.update.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishCardWrite = resolve;
      })
    );
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });

    const cardWrite = cardCommands.update("uid-a", card);
    await vi.waitFor(() => expect(cardMocks.update).toHaveBeenCalledOnce());
    const removal = deckCommands.remove("uid-a", deck);
    await Promise.resolve();
    expect(mocks.remove).not.toHaveBeenCalled();

    finishCardWrite();
    await Promise.all([cardWrite, removal]);
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a");
  });

  it("does not block Card writes or Deck removals for other memberships", async () => {
    let finishRemoval!: () => void;
    mocks.remove
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finishRemoval = resolve;
        })
      )
      .mockResolvedValueOnce(undefined);
    const blockedDeck = createDeck({ id: "blocked" });
    const otherDeck = createDeck({ id: "other" });
    const otherDeckCard = createCard({ id: "other-deck-card", deckId: otherDeck.id });
    const otherUidCard = createCard({ id: "other-uid-card", uid: "uid-b", deckId: blockedDeck.id });

    const blockedRemoval = deckCommands.remove("uid-a", blockedDeck);
    await vi.waitFor(() => expect(mocks.remove).toHaveBeenCalledOnce());
    const otherDeckWrite = cardCommands.create("uid-a", otherDeckCard);
    const otherUidWrite = cardCommands.create("uid-b", otherUidCard);
    const otherRemoval = deckCommands.remove("uid-a", otherDeck);

    await vi.waitFor(() => {
      expect(cardMocks.create).toHaveBeenCalledTimes(2);
      expect(mocks.remove).toHaveBeenCalledTimes(2);
    });

    finishRemoval();
    await Promise.all([blockedRemoval, otherDeckWrite, otherUidWrite, otherRemoval]);
  });
});
