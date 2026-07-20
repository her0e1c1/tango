import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { remoteStore } from "@/store/remoteStore";
import { createCard } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  card: null as Card | null,
  cardById: vi.fn(),
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
    cardById: mocks.cardById,
  }),
}));
vi.mock("@/adapters/firestore/card", () => ({
  create: mocks.create,
  update: mocks.update,
  logicalRemove: mocks.logicalRemove,
  upsert: mocks.upsert,
}));

import { useCardMutations } from "@/features/card/hooks/useCardMutations";

describe("useCardMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    remoteStore.getState().stop();
    mocks.uid = "uid-a";
    mocks.card = null;
    mocks.cardById.mockImplementation(() => mocks.card);
    mocks.create.mockResolvedValue("card-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.logicalRemove.mockResolvedValue(undefined);
    mocks.upsert.mockResolvedValue("card-id");
  });

  it("keeps mutation runners stable across an unchanged render", () => {
    const { result, rerender } = renderHook(useCardMutations);
    const actions = result.current;

    rerender();

    expect(result.current.create).toBe(actions.create);
    expect(result.current.update).toBe(actions.update);
    expect(result.current.remove).toBe(actions.remove);
    expect(result.current.bulkUpsert).toBe(actions.bulkUpsert);
    expect(result.current.retry).toBe(actions.retry);
  });

  it("routes Card create, update, and bulk upsert through the store", async () => {
    const first = createCard({ id: "first", score: 0 });
    const second = createCard({ id: "second" });
    const { result } = renderHook(useCardMutations);

    await act(async () => result.current.create(first));
    await act(async () => result.current.update({ ...first, score: 1 }));
    await act(async () => result.current.bulkUpsert([first, second]));

    expect(mocks.create).toHaveBeenCalledWith(first);
    expect(mocks.update).toHaveBeenCalledWith({ ...first, score: 1 });
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(remoteStore.getState().read.cardsById).toEqual({});
  });

  it("uses the current Card for updateBy and remove", async () => {
    const card = createCard({ id: "card", score: 0 });
    mocks.card = card;
    const { result } = renderHook(useCardMutations);

    await act(async () => result.current.updateBy(card.id, () => ({ score: 2 })));
    await act(async () => result.current.remove(card.id));

    expect(mocks.update).toHaveBeenCalledWith({ ...card, score: 2 });
    expect(mocks.logicalRemove).toHaveBeenCalledWith(card.id);
  });

  it("rejects updateBy and remove when the Card is unavailable", async () => {
    const { result } = renderHook(useCardMutations);

    await expect(result.current.updateBy("missing", () => ({ score: 2 }))).rejects.toThrow(
      "Card missing is not available"
    );
    await expect(result.current.remove("missing")).rejects.toThrow("Card missing is not available");
  });

  it("exposes per-Card pending state while an update is running", async () => {
    let finish!: () => void;
    mocks.update.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const card = createCard({ id: "card" });
    const { result } = renderHook(useCardMutations);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.update(card);
    });

    await waitFor(() => {
      expect(result.current.pending).toBe(true);
      expect(result.current.isPending(card.id)).toBe(true);
      expect(result.current.isPending("other")).toBe(false);
    });
    await act(async () => {
      finish();
      await operation;
    });
    expect(result.current.pending).toBe(false);
  });

  it("rejects writes without a confirmed user and exposes the error", async () => {
    mocks.uid = "";
    const { result } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.create(createCard())).rejects.toThrow("confirmed user");
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(
      expect.objectContaining({ message: expect.stringContaining("confirmed user") })
    );
  });

  it("retries the latest failed mutation", async () => {
    const card = createCard({ id: "failed" });
    const error = new Error("update failed");
    mocks.update.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(useCardMutations);

    await act(async () => {
      await expect(result.current.update(card)).rejects.toBe(error);
    });
    expect(result.current.error).toBe(error);
    act(() => result.current.retry());

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
  });

  it("does not expose a stale operation after the authenticated UID changes", async () => {
    let finish!: () => void;
    mocks.create.mockReturnValueOnce(new Promise<string>((resolve) => (finish = () => resolve("card"))));
    const card = createCard({ id: "card" });
    const { result, rerender } = renderHook(useCardMutations);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.create(card);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    remoteStore.getState().stop();
    mocks.uid = "uid-b";
    rerender();

    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
    await act(async () => {
      finish();
      await operation;
    });
    expect(result.current.pending).toBe(false);
  });
});
