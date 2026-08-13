import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ run: vi.fn(), useAsyncAction: vi.fn() }));

vi.mock("@/entities/auth-session", () => ({
  useAuthSession: () => ({ status: "authenticated", uid: "uid" }),
}));
vi.mock("@/shared/hooks", () => ({
  useAsyncAction: (scope: string) => {
    mocks.useAsyncAction(scope);
    return { run: mocks.run, pending: false, isPending: vi.fn(), error: null, retry: vi.fn() };
  },
}));

import { useStudyProgressMutations } from "./useStudyProgressMutations";

describe("useStudyProgressMutations", () => {
  it("scopes async state to both user and Deck", () => {
    const { rerender } = renderHook(({ deckId }) => useStudyProgressMutations(deckId), {
      initialProps: { deckId: "deck-a" },
    });
    expect(mocks.useAsyncAction).toHaveBeenLastCalledWith("uid:deck-a");

    rerender({ deckId: "deck-b" });
    expect(mocks.useAsyncAction).toHaveBeenLastCalledWith("uid:deck-b");
  });
});
