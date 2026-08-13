import type { Deck } from "../model/deck";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REMOTE_WRITE_TIMEOUT_MS } from "@/shared/lib/remoteWrite";
import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("./firestore", () => ({
  create: mocks.create,
  update: mocks.update,
}));

import { deckCommands } from "./commands";

const createDeck = (overrides: Partial<Deck> = {}) => createDeckFixture({ uid: "uid-a", ...overrides });

describe("deck commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("created");
    mocks.update.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects missing users and mismatched owners before writing", async () => {
    await expect(deckCommands.create("", createDeck())).rejects.toThrow("confirmed user");
    await expect(deckCommands.create("uid-a", createDeck({ uid: "uid-b" }))).rejects.toThrow("owner does not match");

    expect(mocks.create).not.toHaveBeenCalled();
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

    const firstUpdate = deckCommands.update("uid-a", deck);
    const secondUpdate = deckCommands.update("uid-a", deck);
    await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());

    finishUpdate();
    await Promise.all([firstUpdate, secondUpdate]);
    expect(mocks.update).toHaveBeenCalledTimes(2);
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
  ] as const)("rejects a stalled Deck %s instead of leaving it pending", async (command, label) => {
    vi.useFakeTimers();
    mocks[command].mockReturnValueOnce(new Promise(() => undefined));
    const operation = deckCommands[command]("uid-a", createDeck({ id: `stalled-${command}` }));
    const assertion = expect(operation).rejects.toThrow(`${label} did not finish`);

    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);

    await assertion;
  });
});
