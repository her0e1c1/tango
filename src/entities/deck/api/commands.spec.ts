import type { Deck } from "../model/deck";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REMOTE_WRITE_TIMEOUT_MS } from "@/shared/lib/remoteWrite";
import { deckMembershipMutationLock, withDeckMembershipLocks } from "@/store/remoteMutationLocks";
import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("./firestore", () => ({
  create: mocks.create,
  update: mocks.update,
}));
vi.mock("@/adapters/firestore/deck", () => ({
  remove: mocks.remove,
}));

import { deckCommands } from "./commands";

const createDeck = (overrides: Partial<Deck> = {}) => createDeckFixture({ uid: "uid-a", ...overrides });

describe("deck commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("created");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
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

  it("updates without ownership metadata in the edit input", async () => {
    await deckCommands.update("uid-a", { id: "deck", name: "Updated" });

    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ id: "deck", name: "Updated" });
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

  it("waits to remove a Deck while its membership is shared-locked", async () => {
    let finishShared!: () => void;
    const sharedStarted = vi.fn();
    const blockedDeck = createDeck({ id: "blocked" });
    const unrelatedDeck = createDeck({ id: "unrelated" });
    const shared = withDeckMembershipLocks([deckMembershipMutationLock("uid-a", blockedDeck.id)], "shared", () => {
      sharedStarted();
      return new Promise<void>((resolve) => {
        finishShared = resolve;
      });
    });
    await vi.waitFor(() => expect(sharedStarted).toHaveBeenCalledOnce());

    const blockedRemoval = deckCommands.remove("uid-a", blockedDeck);
    const unrelatedRemoval = deckCommands.remove("uid-a", unrelatedDeck);

    await vi.waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(unrelatedDeck.id, "uid-a"));
    expect(mocks.remove).not.toHaveBeenCalledWith(blockedDeck.id, "uid-a");

    finishShared();
    await Promise.all([shared, blockedRemoval, unrelatedRemoval]);
    expect(mocks.remove).toHaveBeenCalledWith(blockedDeck.id, "uid-a");
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
});
