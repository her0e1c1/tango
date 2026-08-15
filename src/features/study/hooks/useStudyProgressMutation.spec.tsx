import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  editStudyProgress: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "current-user" }));
vi.mock("@/entities/study-progress", () => ({ editStudyProgress: mocks.editStudyProgress }));

import { useStudyProgressMutation } from "./useStudyProgressMutation";

describe("useStudyProgressMutation", () => {
  beforeEach(() => {
    mocks.editStudyProgress.mockReset().mockResolvedValue(undefined);
  });

  it("saves the active Study update for the current user", async () => {
    const progress = { cardId: "card-id", score: 2, numberOfSeen: 4, lastSeenAt: 123 };
    const { result } = renderHook(() => useStudyProgressMutation());

    await result.current.save(progress);

    expect(mocks.editStudyProgress).toHaveBeenCalledExactlyOnceWith("current-user", progress);
  });
});
