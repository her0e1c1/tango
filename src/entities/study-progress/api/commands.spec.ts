import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REMOTE_WRITE_TIMEOUT_MS } from "@/shared/lib/remoteWrite";
import { deckMembershipMutationLock, withDeckMembershipLocks } from "@/store/remoteMutationLocks";

const mocks = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock("./firestore", () => ({ update: mocks.update }));

import { studyProgressCommands } from "./commands";

describe("study progress commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue(undefined);
  });

  afterEach(() => vi.useRealTimers());

  it("rejects missing users before writing", async () => {
    await expect(studyProgressCommands.update("", "deck", { cardId: "card", score: 1 })).rejects.toThrow(
      "confirmed user"
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("serializes writes to the same Card", async () => {
    let finishFirst!: () => void;
    mocks.update.mockReturnValueOnce(new Promise<void>((resolve) => (finishFirst = resolve)));

    const first = studyProgressCommands.update("uid", "deck", { cardId: "card", score: 1 });
    const second = studyProgressCommands.update("uid", "deck", { cardId: "card", score: 2 });
    await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());

    finishFirst();
    await Promise.all([first, second]);
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });

  it("waits while the Deck membership is exclusively locked", async () => {
    let finishExclusive!: () => void;
    const exclusive = withDeckMembershipLocks(
      [deckMembershipMutationLock("uid", "deck")],
      "exclusive",
      () => new Promise<void>((resolve) => (finishExclusive = resolve))
    );
    const update = studyProgressCommands.update("uid", "deck", { cardId: "card", score: 1 });
    await Promise.resolve();
    expect(mocks.update).not.toHaveBeenCalled();

    finishExclusive();
    await Promise.all([exclusive, update]);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("rejects stalled remote writes", async () => {
    vi.useFakeTimers();
    mocks.update.mockReturnValueOnce(new Promise(() => undefined));
    const operation = studyProgressCommands.update("uid", "deck", { cardId: "card", score: 1 });
    const assertion = expect(operation).rejects.toThrow("did not finish");

    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);
    await assertion;
  });
});
