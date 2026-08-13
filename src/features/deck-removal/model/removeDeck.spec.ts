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

  it("rejects a stalled removal", async () => {
    vi.useFakeTimers();
    mocks.removeDeckWithCards.mockReturnValueOnce(new Promise(() => undefined));
    const deck = createDeck({ uid: "uid-a" });
    const operation = removeDeck(deck.uid, deck);
    const assertion = expect(operation).rejects.toThrow("Deck deletion did not finish");

    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);

    await assertion;
  });
});
