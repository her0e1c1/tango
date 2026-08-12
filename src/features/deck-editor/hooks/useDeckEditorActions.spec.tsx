import type { Deck } from "@/entities/deck";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  update: vi.fn(),
  retry: vi.fn(),
}));

vi.mock("@/entities/deck", () => ({
  useDeckMutations: () => ({
    update: mocks.update,
    pending: false,
    error: null,
    retry: mocks.retry,
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

import { useDeckEditorActions } from "./useDeckEditorActions";

describe("useDeckEditorActions", () => {
  const deck: Deck = createDeck();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue(undefined);
  });

  it("navigates to the Deck list after a successful update", async () => {
    const { result } = renderHook(useDeckEditorActions);

    await actAsync(async () => {
      await result.current.updateAndGoToList(deck);
    });

    expect(mocks.update).toHaveBeenCalledExactlyOnceWith(deck);
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true });
  });

  it("keeps the editor open after an update fails", async () => {
    mocks.update.mockRejectedValueOnce(new Error("update failed"));
    const { result } = renderHook(useDeckEditorActions);

    await actAsync(async () => {
      await result.current.updateAndGoToList(deck);
    });

    expect(mocks.update).toHaveBeenCalledExactlyOnceWith(deck);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
