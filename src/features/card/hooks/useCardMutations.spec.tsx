/**
 * @file Verifies the "useCardMutations" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps the update runner
 * stable across an unchanged render", "routes Card updates through the Firestore mutation
 * service", "exposes immutable pending state while a Card update is running".
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { remoteStore } from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  card: null as Card | null,
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () =>
    mocks.uid === "" ? { status: "anonymous" } : { status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } },
}));
vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    cardById: () => mocks.card,
  }),
}));
vi.mock("@/adapters/firestore", () => ({
  card: {
    create: mocks.create,
    update: mocks.update,
    logicalRemove: mocks.logicalRemove,
    upsert: mocks.upsert,
  },
}));

import { useCardMutations } from "@/features/card/hooks/useCardMutations";

describe("useCardMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.card = null;
    remoteStore.clear();
    remoteStore.begin("uid-a");
    mocks.create.mockResolvedValue("card-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.logicalRemove.mockResolvedValue(undefined);
    mocks.upsert.mockResolvedValue("card-id");
  });

  it("keeps the update runner stable across an unchanged render", () => {
    const { result, rerender } = renderHook(useCardMutations);
    const update = result.current.update;

    rerender();

    expect(result.current.update).toBe(update);
  });

  it("publishes a created Card only after the listener responds", async () => {
    const card = createCard({ id: "created" });
    const { result } = renderHook(useCardMutations);

    await act(async () => result.current.create(card));

    expect(mocks.create).toHaveBeenCalledWith(card);
    expect(remoteStore.getSnapshot().cardsById).toEqual({});

    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [card.id]: card });
  });

  it("publishes an updated Card only after the listener responds", async () => {
    const deck = createDeck();
    mocks.card = createCard({ deckId: deck.id, score: 0 });
    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [mocks.card.id]: mocks.card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useCardMutations);
    const updated = { ...mocks.card, score: 1 } as Card;

    await act(async () => result.current.update(updated));

    expect(mocks.update).toHaveBeenCalledWith(updated);
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [mocks.card.id]: mocks.card });

    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [updated.id]: updated },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [updated.id]: updated });
  });

  it("removes a Card from remote data only after the listener responds", async () => {
    const card = createCard({ id: "removed" });
    mocks.card = card;
    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useCardMutations);

    await act(async () => result.current.remove(card.id));

    expect(mocks.logicalRemove).toHaveBeenCalledWith(card.id);
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [card.id]: card });

    remoteStore.applySnapshot("uid-a", "cards", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    expect(remoteStore.getSnapshot().cardsById).toEqual({});
  });

  it("publishes bulk-upserted Cards only after the listener responds", async () => {
    const existing = createCard({ id: "existing", score: 0 });
    const created = createCard({ id: "created", score: 0 });
    const updated = { ...existing, score: 1 };
    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [existing.id]: existing },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useCardMutations);

    await act(async () => result.current.bulkUpsert([updated, created]));

    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [existing.id]: existing });

    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [updated.id]: updated, [created.id]: created },
      metadata: { size: 2, fromCache: false, hasPendingWrites: false },
    });
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [updated.id]: updated, [created.id]: created });
  });

  it("exposes immutable pending state while a Card update is running", async () => {
    let finishUpdate: () => void = () => undefined;
    mocks.update.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishUpdate = resolve;
        })
    );
    const deck = createDeck();
    const card = createCard({ deckId: deck.id, score: 0 });
    mocks.card = card;
    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useCardMutations);
    let update: Promise<void> | undefined;

    act(() => {
      update = result.current.update({ ...card, score: 1 });
    });

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledOnce();
      expect(result.current.pending).toBe(true);
      expect(result.current.isPending(card.id)).toBe(true);
    });

    await act(async () => {
      finishUpdate();
      await update;
    });
    expect(result.current.pending).toBe(false);
    expect(result.current.isPending(card.id)).toBe(false);
  });

  it("rejects remote writes without a confirmed user", async () => {
    mocks.uid = "";
    const card = createCard();
    const { result } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.create(card)).rejects.toThrow("confirmed user");
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(
      expect.objectContaining({ message: expect.stringContaining("confirmed user") })
    );
  });

  it("leaves remote Card data unchanged after a failed update and its retry", async () => {
    const card = createCard({ id: "failed-update", score: 0 });
    const updated = { ...card, score: 1 };
    const error = new Error("update failed");
    mocks.update.mockRejectedValueOnce(error);
    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.update(updated)).rejects.toBe(error);
    });

    expect(result.current.error).toBe(error);
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [card.id]: card });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [card.id]: card });
  });

  it("leaves remote Card data unchanged after a failed removal and its retry", async () => {
    const card = createCard({ id: "failed-remove" });
    const error = new Error("remove failed");
    mocks.card = card;
    mocks.logicalRemove.mockRejectedValueOnce(error);
    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.remove(card.id)).rejects.toBe(error);
    });

    expect(result.current.error).toBe(error);
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [card.id]: card });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(mocks.logicalRemove).toHaveBeenCalledTimes(2);
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [card.id]: card });
  });

  it("leaves remote Card data unchanged after a partial bulk failure", async () => {
    const first = createCard({ id: "first", score: 0 });
    const second = createCard({ id: "second", score: 0 });
    const updates = [
      { ...first, score: 1 },
      { ...second, score: 1 },
    ];
    const error = new Error("second failed");
    mocks.upsert.mockImplementation((card: Card) =>
      card.id === second.id ? Promise.reject(error) : Promise.resolve(card.id)
    );
    remoteStore.applySnapshot("uid-a", "cards", {
      data: { [first.id]: first, [second.id]: second },
      metadata: { size: 2, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.bulkUpsert(updates)).rejects.toThrow("1 of 2 Card writes failed");
    });

    expect(result.current.error).toEqual(expect.objectContaining({ failedIds: [second.id] }));
    expect(remoteStore.getSnapshot().cardsById).toEqual({ [first.id]: first, [second.id]: second });
  });

  it("ignores an old UID operation when it settles during a current operation", async () => {
    const oldCard = createCard({ id: "shared" });
    const newCard = createCard({ id: "shared", uid: "uid-b" });
    let finishOld!: () => void;
    let finishNew!: () => void;
    mocks.create
      .mockReturnValueOnce(new Promise<string>((resolve) => (finishOld = () => resolve(oldCard.id))))
      .mockReturnValueOnce(new Promise<string>((resolve) => (finishNew = () => resolve(newCard.id))));
    const { result, rerender } = renderHook(useCardMutations);

    let oldOperation!: Promise<void>;
    act(() => {
      oldOperation = result.current.create(oldCard);
    });
    await waitFor(() => expect(result.current.isPending(oldCard.id)).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    await waitFor(() => expect(result.current.pending).toBe(false));
    let newOperation!: Promise<void>;
    act(() => {
      newOperation = result.current.create(newCard);
    });
    await waitFor(() => expect(result.current.isPending(newCard.id)).toBe(true));

    await act(async () => {
      finishOld();
      await oldOperation;
    });
    expect(result.current.isPending(newCard.id)).toBe(true);
    await act(async () => {
      finishNew();
      await newOperation;
    });
  });

  it("does not resurrect pending state after an A-to-B-to-A UID transition", async () => {
    let finish!: () => void;
    mocks.create.mockReturnValueOnce(new Promise<string>((resolve) => (finish = () => resolve("card"))));
    const card = createCard({ id: "card" });
    const { result, rerender } = renderHook(useCardMutations);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.create(card);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    mocks.uid = "uid-a";
    rerender();

    expect(result.current.pending).toBe(false);
    expect(result.current.isPending(card.id)).toBe(false);
    await act(async () => {
      finish();
      await operation;
    });
  });

  it("does not resurrect an error after an A-to-B-to-A UID transition", async () => {
    const error = new Error("write failed");
    mocks.create.mockRejectedValueOnce(error);
    const { result, rerender } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.create(createCard())).rejects.toBe(error);
    });
    expect(result.current.error).toBe(error);
    mocks.uid = "uid-b";
    rerender();
    mocks.uid = "uid-a";
    rerender();

    expect(result.current.error).toBeNull();
  });

  it("keeps the latest Card failure retryable after an unrelated Card succeeds", async () => {
    const failed = createCard({ id: "failed" });
    const successful = createCard({ id: "successful" });
    const error = new Error("failed write");
    let rejectFailed!: (error: Error) => void;
    let finishSuccessful!: () => void;
    mocks.update.mockImplementation((card: CardEdit) => {
      if (card.id === failed.id && mocks.update.mock.calls.filter(([value]) => value.id === failed.id).length === 1) {
        return new Promise<void>((_resolve, reject) => (rejectFailed = reject));
      }
      if (card.id === successful.id) return new Promise<void>((resolve) => (finishSuccessful = resolve));
      return Promise.resolve();
    });
    const { result } = renderHook(useCardMutations);

    let failedOperation!: Promise<void>;
    let successfulOperation!: Promise<void>;
    act(() => {
      failedOperation = result.current.update(failed);
      successfulOperation = result.current.update(successful);
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
    await act(async () => {
      rejectFailed(error);
      await expect(failedOperation).rejects.toBe(error);
    });
    await act(async () => {
      finishSuccessful();
      await successfulOperation;
    });

    expect(result.current.error).toBe(error);
    act(() => result.current.retry());
    await waitFor(() => {
      expect(mocks.update.mock.calls.filter(([card]) => card.id === failed.id)).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });
  });

  it("clears a failed Card update after a newer update for the same Card succeeds", async () => {
    const stale = createCard({ id: "card", score: 1 });
    const replacement = { ...stale, score: 2 };
    const error = new Error("stale update failed");
    mocks.update.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.update(stale)).rejects.toBe(error);
    });
    expect(result.current.error).toBe(error);

    await act(async () => result.current.update(replacement));
    expect(result.current.error).toBeNull();
    act(() => result.current.retry());

    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
    expect(mocks.update).toHaveBeenNthCalledWith(1, stale);
    expect(mocks.update).toHaveBeenNthCalledWith(2, replacement);
  });

  it("clears an older queued Card failure after a newer same-Card update succeeds", async () => {
    const first = createCard({ id: "card", score: 1 });
    const second = { ...first, score: 2 };
    const error = new Error("first update failed");
    let rejectFirst!: (error: Error) => void;
    mocks.update
      .mockReturnValueOnce(new Promise<void>((_resolve, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(useCardMutations);

    let firstOperation!: Promise<void>;
    let secondOperation!: Promise<void>;
    act(() => {
      firstOperation = result.current.update(first);
      secondOperation = result.current.update(second);
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledExactlyOnceWith(first));

    await act(async () => {
      rejectFirst(error);
      await expect(firstOperation).rejects.toBe(error);
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
    await act(async () => secondOperation);

    expect(result.current.error).toBeNull();
    act(() => result.current.retry());
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
  });
});
