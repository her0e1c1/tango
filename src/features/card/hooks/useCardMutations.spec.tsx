import type { Card } from "@/entities/card";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";
import { actAsync } from "@/test/act";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  card: null as Card | null,
  cardById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/entities/session", () => ({
  useSession: () =>
    mocks.uid === ""
      ? { status: "signedOut" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("@/hooks/useRemoteCollections", () => ({
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
    mocks.uid = "uid-a";
    mocks.card = null;
    mocks.cardById.mockImplementation(() => mocks.card);
    mocks.create.mockResolvedValue("card-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.logicalRemove.mockResolvedValue(undefined);
    mocks.upsert.mockResolvedValue("card-id");
  });

  it("does not allow updateBy patches to redirect the target Card", async () => {
    const card = createCard({ id: "card", deckId: "deck" });
    mocks.card = card;
    const { result } = renderHook(useCardMutations);
    const redirectingPatch = () => ({ id: "other-card", deckId: "other-deck", score: 2 });

    await actAsync(async () => result.current.updateBy(card.id, redirectingPatch));

    expect(mocks.update).toHaveBeenCalledWith({ id: card.id, deckId: card.deckId, score: 2 });
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
    await actAsync(async () => {
      finish();
      await operation;
    });
    expect(result.current.pending).toBe(false);
  });

  it("rejects writes without a confirmed user and exposes the error", async () => {
    mocks.uid = "";
    const { result } = renderHook(useCardMutations);

    await actAsync(async () => {
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

    await actAsync(async () => {
      await expect(result.current.update(card)).rejects.toBe(error);
    });
    expect(result.current.error).toBe(error);
    act(() => result.current.retry());

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
  });

  it("reports a successful Card removal after retry", async () => {
    const card = createCard({ id: "failed-remove" });
    const onRemoveSuccess = vi.fn();
    mocks.card = card;
    mocks.logicalRemove.mockRejectedValueOnce(new Error("remove failed")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCardMutations({ onRemoveSuccess }));

    await actAsync(async () => {
      await expect(result.current.remove(card.id)).rejects.toThrow("remove failed");
    });
    expect(onRemoveSuccess).not.toHaveBeenCalled();
    act(() => result.current.retry());

    await waitFor(() => expect(onRemoveSuccess).toHaveBeenCalledExactlyOnceWith(card));
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
    mocks.uid = "uid-b";
    rerender();

    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
    await actAsync(async () => {
      finish();
      await operation;
    });
    expect(result.current.pending).toBe(false);
  });
});
