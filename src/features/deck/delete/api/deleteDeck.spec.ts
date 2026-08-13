import type { Deck } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { resourceKey, withResourceAccess } from "@/shared/lib/resourceAccess";
import { REMOTE_WRITE_TIMEOUT_MS } from "@/shared/lib/remoteWrite";
import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteDocuments: vi.fn(),
}));

vi.mock("./firestore", () => ({ deleteDeckDocuments: mocks.deleteDocuments }));

import { deleteDeck } from "./deleteDeck";

describe("deleteDeck", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" }) as Deck;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteDocuments.mockResolvedValue(undefined);
  });

  it("deletes the owned Deck and its documents", async () => {
    await deleteDeck("uid-a", deck);
    expect(mocks.deleteDocuments).toHaveBeenCalledExactlyOnceWith("uid-a", deck.id);
  });

  it("keeps the Deck when Card deletion fails", async () => {
    mocks.deleteDocuments.mockRejectedValue(new Error("card deletion failed"));
    await expect(deleteDeck("uid-a", deck)).rejects.toThrow("card deletion failed");
  });

  it("rejects a mismatched owner before deleting", async () => {
    await expect(deleteDeck("uid-b", deck)).rejects.toThrow("owner does not match");
    expect(mocks.deleteDocuments).not.toHaveBeenCalled();
  });

  it("serializes deletions of the same Deck", async () => {
    let finishFirst!: () => void;
    mocks.deleteDocuments.mockImplementationOnce(() => new Promise<void>((resolve) => (finishFirst = resolve)));

    const first = deleteDeck("uid-a", deck);
    await vi.waitFor(() => expect(mocks.deleteDocuments).toHaveBeenCalledOnce());
    const second = deleteDeck("uid-a", deck);
    await Promise.resolve();
    expect(mocks.deleteDocuments).toHaveBeenCalledOnce();

    finishFirst();
    await Promise.all([first, second]);
    expect(mocks.deleteDocuments).toHaveBeenCalledTimes(2);
  });

  it("deletes unrelated Decks independently", async () => {
    const otherDeck = createDeckFixture({ id: "other-deck", uid: "uid-a" }) as Deck;
    let finishFirst!: () => void;
    mocks.deleteDocuments.mockImplementationOnce(() => new Promise<void>((resolve) => (finishFirst = resolve)));

    const first = deleteDeck("uid-a", deck);
    const second = deleteDeck("uid-a", otherDeck);
    await vi.waitFor(() => expect(mocks.deleteDocuments).toHaveBeenCalledTimes(2));

    finishFirst();
    await Promise.all([first, second]);
  });

  it("waits for Card membership mutations before deleting the Deck", async () => {
    let finishCardMutation!: () => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => (markStarted = resolve));
    const cardMutation = withResourceAccess([resourceKey("deck-membership", "uid-a", deck.id)], "shared", async () => {
      markStarted();
      await new Promise<void>((resolve) => (finishCardMutation = resolve));
    });
    await started;

    const deletion = deleteDeck("uid-a", deck);
    await Promise.resolve();
    expect(mocks.deleteDocuments).not.toHaveBeenCalled();

    finishCardMutation();
    await Promise.all([cardMutation, deletion]);
    expect(mocks.deleteDocuments).toHaveBeenCalledOnce();
  });

  it("times out when Deck deletion does not finish", async () => {
    vi.useFakeTimers();
    mocks.deleteDocuments.mockReturnValue(new Promise(() => undefined));

    const deletion = deleteDeck("uid-a", deck);
    const rejection = expect(deletion).rejects.toThrow("Deck deletion did not finish within 15 seconds");
    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);

    await rejection;
    vi.useRealTimers();
  });
});
