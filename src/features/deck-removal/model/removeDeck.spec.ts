import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deckMembershipMutationLock, withDeckMembershipLocks } from "@/entities/deck";
import { REMOTE_WRITE_TIMEOUT_MS } from "@/shared/lib/remoteWrite";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({ removeDeckWithCards: vi.fn() }));

vi.mock("../api/removeDeck", () => ({ removeDeckWithCards: mocks.removeDeckWithCards }));

import { removeDeck } from "./removeDeck";

describe("removeDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.removeDeckWithCards.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects missing users and mismatched owners before writing", async () => {
    await expect(removeDeck("", createDeck({ uid: "" }))).rejects.toThrow("confirmed user");
    await expect(removeDeck("uid-a", createDeck({ uid: "uid-b" }))).rejects.toThrow("owner does not match");
    expect(mocks.removeDeckWithCards).not.toHaveBeenCalled();
  });

  it("waits for the Deck membership lock before removing", async () => {
    const deck = createDeck({ id: "deck", uid: "uid-a" });
    let finishShared!: () => void;
    const shared = withDeckMembershipLocks(
      [deckMembershipMutationLock(deck.uid, deck.id)],
      "shared",
      () =>
        new Promise<void>((resolve) => {
          finishShared = resolve;
        })
    );
    await vi.waitFor(() => expect(finishShared).toBeTypeOf("function"));

    const removal = removeDeck(deck.uid, deck);
    await Promise.resolve();
    expect(mocks.removeDeckWithCards).not.toHaveBeenCalled();

    finishShared();
    await Promise.all([shared, removal]);
    expect(mocks.removeDeckWithCards).toHaveBeenCalledExactlyOnceWith(deck.id, deck.uid);
  });

  it("reuses the original cleanup when retried after a timeout", async () => {
    vi.useFakeTimers();
    let finishCleanup!: () => void;
    mocks.removeDeckWithCards.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishCleanup = resolve;
      })
    );
    const deck = createDeck({ id: "slow-deck", uid: "uid-a" });
    const firstRemoval = removeDeck(deck.uid, deck);
    const timeout = expect(firstRemoval).rejects.toThrow("Deck deletion did not finish");

    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);
    await timeout;

    const retry = removeDeck(deck.uid, deck);
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.removeDeckWithCards).toHaveBeenCalledOnce();

    finishCleanup();
    await retry;
    expect(mocks.removeDeckWithCards).toHaveBeenCalledOnce();
  });

  it("starts a new cleanup when retried after the original fails", async () => {
    const failure = new Error("cleanup failed");
    mocks.removeDeckWithCards.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const deck = createDeck({ id: "failed-deck", uid: "uid-a" });

    await expect(removeDeck(deck.uid, deck)).rejects.toBe(failure);
    await removeDeck(deck.uid, deck);

    expect(mocks.removeDeckWithCards).toHaveBeenCalledTimes(2);
  });
});
