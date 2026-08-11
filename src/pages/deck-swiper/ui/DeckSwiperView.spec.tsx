import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { DeckSwiperView } from "./DeckSwiperView";

describe("DeckSwiperView", () => {
  afterEach(cleanup);

  it("gives swipe overlays accessible names", () => {
    const view = render(
      <DeckSwiperView
        showBackText
        backTextSlot={<div>Back</div>}
        swipeOverlay={{
          onClickLeft: vi.fn(),
          onClickRight: vi.fn(),
          onClickUp: vi.fn(),
          onClickDown: vi.fn(),
        }}
      />
    );

    expect(view.getByRole("button", { name: "Swipe left" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Swipe right" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Swipe up" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Swipe down" })).toBeInTheDocument();
  });
});
