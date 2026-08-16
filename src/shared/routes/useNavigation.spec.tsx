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

  it("navigates to every page destination", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      void result.current.goToDeckList();
      void result.current.goToCardList("deck-id");
      void result.current.goToDeckForm("deck-id");
      void result.current.goToDeckStudyStart("deck-id");
      void result.current.goToDeckStudy("deck-id");
      void result.current.goToCardView("card-id");
      void result.current.goToCardForm("card-id");
      void result.current.goToSettings();
      void result.current.goToDeckImport();
    });

    expect(mocks.navigate.mock.calls).toEqual([
      ["/"],
      ["/deck/deck-id"],
      ["/deck/deck-id/edit"],
      ["/deck/deck-id/start"],
      ["/deck/deck-id/study"],
      ["/card/card-id"],
      ["/card/card-id/edit"],
      ["/settings"],
      ["/import"],
    ]);
  });

  it("forwards navigation options and history navigation", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      void result.current.goToDeckStudy("deck-id", { replace: true });
      void result.current.goBack();
    });

    expect(mocks.navigate.mock.calls).toEqual([["/deck/deck-id/study", { replace: true }], [-1]]);
  });
});
