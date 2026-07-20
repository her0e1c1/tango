/**
 * @file Verifies the "useCardMutations" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps the update runner
 * stable across an unchanged render", "routes Card updates through the Firestore mutation
 * service", "exposes immutable pending state while a Card update is running".
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { firestoreKeys } from "@/query/cache/firestoreKeys";
import { createTestQueryClient, createQueryWrapper } from "@/query/testUtils";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  card: null as Card | null,
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
  readAll: vi.fn(),
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
    readAll: mocks.readAll,
  },
}));

import { useCardMutations } from "@/features/card/hooks/useCardMutations";

describe("useCardMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.update.mockResolvedValue(undefined);
    mocks.readAll.mockResolvedValue([]);
  });

  it("keeps the update runner stable across an unchanged render", () => {
    const { result, rerender } = renderHook(useCardMutations, { wrapper: createQueryWrapper(createTestQueryClient()) });
    const update = result.current.update;

    rerender();

    expect(result.current.update).toBe(update);
  });

  it("writes a Card without replacing remote data before the listener responds", async () => {
    const deck = createDeck();
    mocks.card = createCard({ deckId: deck.id, score: 0 });
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.cards("uid-a"), { [mocks.card.id]: mocks.card });
    const { result } = renderHook(useCardMutations, { wrapper: createQueryWrapper(client) });

    await act(async () => result.current.update({ ...mocks.card, score: 1 } as Card));

    expect(mocks.update).toHaveBeenCalledWith({ ...mocks.card, score: 1 });
    expect(client.getQueryData(firestoreKeys.cards("uid-a"))).toEqual({ [mocks.card.id]: mocks.card });
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
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.cards("uid-a"), { [card.id]: card });
    const { result } = renderHook(useCardMutations, { wrapper: createQueryWrapper(client) });
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
    const { result } = renderHook(useCardMutations, { wrapper: createQueryWrapper(createTestQueryClient()) });

    await act(async () => {
      await expect(result.current.create(card)).rejects.toThrow("confirmed user");
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(
      expect.objectContaining({ message: expect.stringContaining("confirmed user") })
    );
  });

  it("ignores an old UID operation when it settles during a current operation", async () => {
    const oldCard = createCard({ id: "shared" });
    const newCard = createCard({ id: "shared", uid: "uid-b" });
    let finishOld!: () => void;
    let finishNew!: () => void;
    mocks.create
      .mockReturnValueOnce(new Promise<string>((resolve) => (finishOld = () => resolve(oldCard.id))))
      .mockReturnValueOnce(new Promise<string>((resolve) => (finishNew = () => resolve(newCard.id))));
    const { result, rerender } = renderHook(useCardMutations, {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

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
});
