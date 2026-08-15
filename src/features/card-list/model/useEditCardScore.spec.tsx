import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  editStudyProgress: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "current-user" }));
vi.mock("@/entities/study-progress", () => ({ editStudyProgress: mocks.editStudyProgress }));

import { useEditCardScore } from "./useEditCardScore";

describe("useEditCardScore", () => {
  beforeEach(() => {
    mocks.editStudyProgress.mockReset().mockResolvedValue(undefined);
  });

  it("updates only the selected Card score for the current user", async () => {
    const { result } = renderHook(() => useEditCardScore());

    await result.current.updateScore("card-id", 3);

    expect(mocks.editStudyProgress).toHaveBeenCalledExactlyOnceWith("current-user", {
      cardId: "card-id",
      score: 3,
    });
  });
});
