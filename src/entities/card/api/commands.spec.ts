import type { Card } from "../model/card";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REMOTE_WRITE_TIMEOUT_MS } from "@/shared/lib/remoteWrite";
import { deckMembershipMutationLock, withDeckMembershipLocks } from "@/store/remoteMutationLocks";
import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("./firestore", () => ({
  create: mocks.create,
  update: mocks.update,
  logicalRemove: mocks.logicalRemove,
  upsert: mocks.upsert,
}));

import { cardCommands } from "./commands";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });

describe("card commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("created");
    mocks.update.mockResolvedValue(undefined);
    mocks.logicalRemove.mockResolvedValue(undefined);
    mocks.upsert.mockResolvedValue("upserted");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects missing users and mismatched owners before writing", async () => {
    await expect(cardCommands.create("", createCard())).rejects.toThrow("confirmed user");
    await expect(cardCommands.update("uid-a", createCard({ uid: "uid-b" }))).rejects.toThrow("owner does not match");

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("serializes writes to the same Card", async () => {
    let finishCreate!: () => void;
    mocks.create.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        finishCreate = () => resolve("created");
      })
    );
    const card = createCard({ id: "card" });

    const create = cardCommands.create("uid-a", card);
    const update = cardCommands.update("uid-a", { ...card, score: 2 });
    await vi.waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.update).not.toHaveBeenCalled();

    finishCreate();
    await Promise.all([create, update]);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("reports only failed bulk upserts", async () => {
    const first = createCard({ id: "first" });
    const second = createCard({ id: "second" });
    mocks.upsert.mockResolvedValueOnce("first").mockRejectedValueOnce(new Error("failed"));

    await expect(cardCommands.bulkUpsert("uid-a", [first, second])).rejects.toMatchObject({
      failedIds: [second.id],
      message: "1 of 2 Card writes failed",
    });
  });

  it("reports stalled Card imports instead of leaving them pending", async () => {
    vi.useFakeTimers();
    const card = createCard({ id: "stalled-import" });
    mocks.upsert.mockReturnValueOnce(new Promise(() => undefined));
    const operation = cardCommands.bulkUpsert("uid-a", [card]);
    const assertion = expect(operation).rejects.toMatchObject({
      failedIds: [card.id],
      message: "1 of 1 Card writes failed",
    });

    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);

    await assertion;
  });

  it("waits to write a Card while its Deck membership is exclusively locked", async () => {
    let finishExclusive!: () => void;
    const exclusive = withDeckMembershipLocks(
      [deckMembershipMutationLock("uid-a", "deck")],
      "exclusive",
      () =>
        new Promise<void>((resolve) => {
          finishExclusive = resolve;
        })
    );
    const card = createCard({ id: "card", deckId: "deck" });
    const cardWrite = cardCommands.create("uid-a", card);

    await Promise.resolve();
    expect(mocks.create).not.toHaveBeenCalled();

    finishExclusive();
    await Promise.all([exclusive, cardWrite]);
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith(card);
  });

  it("keeps an exclusive Deck membership mutation waiting for a Card write", async () => {
    let finishCardWrite!: () => void;
    mocks.update.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishCardWrite = resolve;
      })
    );
    const card = createCard({ id: "card", deckId: "deck" });
    const cardWrite = cardCommands.update("uid-a", card);
    await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());

    const exclusiveTask = vi.fn();
    const exclusive = withDeckMembershipLocks([deckMembershipMutationLock("uid-a", "deck")], "exclusive", async () =>
      exclusiveTask()
    );
    await Promise.resolve();
    expect(exclusiveTask).not.toHaveBeenCalled();

    finishCardWrite();
    await Promise.all([cardWrite, exclusive]);
    expect(exclusiveTask).toHaveBeenCalledOnce();
  });

  it("does not block Card writes or exclusive mutations for other memberships", async () => {
    let finishExclusive!: () => void;
    const blockedExclusive = withDeckMembershipLocks(
      [deckMembershipMutationLock("uid-a", "blocked")],
      "exclusive",
      () =>
        new Promise<void>((resolve) => {
          finishExclusive = resolve;
        })
    );
    const otherDeckCard = createCard({ id: "other-deck-card", deckId: "other" });
    const otherUidCard = createCard({ id: "other-uid-card", uid: "uid-b", deckId: "blocked" });
    const otherExclusiveTask = vi.fn();

    const otherDeckWrite = cardCommands.create("uid-a", otherDeckCard);
    const otherUidWrite = cardCommands.create("uid-b", otherUidCard);
    const otherExclusive = withDeckMembershipLocks(
      [deckMembershipMutationLock("uid-a", "other")],
      "exclusive",
      async () => otherExclusiveTask()
    );

    await vi.waitFor(() => {
      expect(mocks.create).toHaveBeenCalledTimes(2);
      expect(otherExclusiveTask).toHaveBeenCalledOnce();
    });

    finishExclusive();
    await Promise.all([blockedExclusive, otherDeckWrite, otherUidWrite, otherExclusive]);
  });
});
