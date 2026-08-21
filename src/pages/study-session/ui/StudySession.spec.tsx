import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { StudySession } from "./StudySession";

describe("StudySession", () => {
  it("gives swipe overlays accessible names", () => {
    render(
      <StudySession
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

    expect(screen.getByRole("button", { name: "Swipe left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swipe right" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swipe up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swipe down" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });
});
