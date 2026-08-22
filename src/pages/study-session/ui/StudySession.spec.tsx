import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { StudySession } from "./StudySession";

describe("StudySession", () => {
  it("gives swipe overlays accessible names", () => {
    render(
      <StudySession
        onExit={vi.fn()}
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

  it("reports the explicit Exit action through a plain callback", () => {
    const onExit = vi.fn();
    render(<StudySession onExit={onExit} frontTextSlot={<div>Front</div>} />);

    const exit = screen.getByRole("button", { name: "Exit" });
    expect(exit).toBeVisible();

    fireEvent.click(exit);

    expect(onExit).toHaveBeenCalledOnce();
  });
});
