import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

import { useNavigation } from "./useNavigation";

describe("useNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to a destination", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      void result.current.to("/deck/deck-id");
    });

    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/deck/deck-id", undefined);
  });

  it("forwards navigation options and history navigation", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      void result.current.to("/deck/deck-id/study", { replace: true });
      void result.current.back();
    });

    expect(mocks.navigate.mock.calls).toEqual([["/deck/deck-id/study", { replace: true }], [-1]]);
  });
});
