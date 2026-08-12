import type { Deck } from "@/entities/deck";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";
import { actAsync } from "@/test/act";

const createDeck = (overrides: Partial<Deck> = {}) => createDeckFixture({ uid: "uid-a", ...overrides });

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/entities/session/@x/deck", () => ({
  useSession: () =>
    mocks.uid === ""
      ? { status: "signedOut" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("@/entities/deck/api/firestore", () => ({
  create: mocks.create,
  update: mocks.update,
}));
import { useDeckMutations } from "./useDeckMutations";

describe("useDeckMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.create.mockResolvedValue("deck-id");
    mocks.update.mockResolvedValue(undefined);
  });

  it("exposes per-Deck pending state while an update is running", async () => {
    let finish!: () => void;
    mocks.update.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ id: "deck" });
    const { result } = renderHook(useDeckMutations);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.update(deck);
    });

    await waitFor(() => {
      expect(result.current.pending).toBe(true);
      expect(result.current.isPending(deck.id)).toBe(true);
      expect(result.current.isPending("other")).toBe(false);
    });
    await actAsync(async () => {
      finish();
      await operation;
    });
    expect(result.current.pending).toBe(false);
  });

  it("retries the latest failed update", async () => {
    const deck = createDeck({ id: "deck" });
    const failure = new Error("update failed");
    mocks.update.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const { result } = renderHook(useDeckMutations);

    await actAsync(async () => {
      await expect(result.current.update(deck)).rejects.toBe(failure);
    });
    expect(result.current.error).toBe(failure);
    act(() => result.current.retry());

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
  });

  it("rejects writes without a confirmed user and exposes the error", async () => {
    mocks.uid = "";
    const { result } = renderHook(useDeckMutations);

    await actAsync(async () => {
      await expect(result.current.create(createDeck())).rejects.toThrow("confirmed user");
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(
      expect.objectContaining({ message: expect.stringContaining("confirmed user") })
    );
  });
});
