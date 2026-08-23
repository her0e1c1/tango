import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { StudySession } from "./StudySession";

const swipeLeft = (target: HTMLElement) => {
  const start = { identifier: 1, target, clientX: 200, clientY: 24 };
  const end = { identifier: 1, target, clientX: 20, clientY: 24 };

  fireEvent.touchStart(target, { touches: [start], targetTouches: [start], changedTouches: [start] });
  fireEvent.touchMove(target, { touches: [end], targetTouches: [end], changedTouches: [end] });
  fireEvent.touchEnd(target, { touches: [], targetTouches: [], changedTouches: [end] });
};

const swipeUp = (target: HTMLElement) => {
  const start = { identifier: 1, target, clientX: 24, clientY: 200 };
  const end = { identifier: 1, target, clientX: 24, clientY: 20 };

  fireEvent.touchStart(target, { touches: [start], targetTouches: [start], changedTouches: [start] });
  fireEvent.touchMove(target, { touches: [end], targetTouches: [end], changedTouches: [end] });
  fireEvent.touchEnd(target, { touches: [], targetTouches: [], changedTouches: [end] });
};

const swipeWithMouse = (
  target: HTMLElement,
  start: { clientX: number; clientY: number },
  end: { clientX: number; clientY: number },
  button = 0
) => {
  fireEvent.mouseDown(target, { ...start, button });
  fireEvent.mouseMove(document, { ...end, button });
  fireEvent.mouseUp(document, { ...end, button });
};

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
    render(
      <StudySession onExit={onExit} cardOverlaySlot={<div>Card metadata</div>} frontTextSlot={<div>Front</div>} />
    );

    const exit = screen.getByRole("button", { name: "Exit" });
    const actions = screen.getByRole("toolbar", { name: "Study actions" });
    expect(exit).toBeVisible();
    expect(actions).toContainElement(exit);
    expect(actions).not.toContainElement(screen.getByText("Card metadata"));

    fireEvent.click(exit);

    expect(onExit).toHaveBeenCalledOnce();
  });

  it("reports a swipe performed on the back text", () => {
    const onSwipeLeft = vi.fn();
    render(<StudySession onExit={vi.fn()} showBackText backTextSlot={<div>Back</div>} onSwipeLeft={onSwipeLeft} />);

    swipeLeft(screen.getByText("Back"));

    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it("reserves vertical drags on the back text for scrolling", () => {
    const onSwipeUp = vi.fn();
    render(<StudySession onExit={vi.fn()} showBackText backTextSlot={<div>Long back</div>} onSwipeUp={onSwipeUp} />);

    swipeUp(screen.getByText("Long back"));

    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("reports a vertical swipe performed on the front text", () => {
    const onSwipeUp = vi.fn();
    render(<StudySession onExit={vi.fn()} frontTextSlot={<div>Front</div>} onSwipeUp={onSwipeUp} />);

    swipeUp(screen.getByText("Front"));

    expect(onSwipeUp).toHaveBeenCalledOnce();
  });

  it("treats a primary-button mouse swipe as only a swipe", () => {
    const onSwipeUp = vi.fn();
    const onFrontClick = vi.fn();
    render(
      <StudySession
        onExit={vi.fn()}
        frontTextSlot={
          <button type="button" onClick={onFrontClick}>
            Front
          </button>
        }
        onSwipeUp={onSwipeUp}
      />
    );
    const front = screen.getByRole("button", { name: "Front" });

    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 });
    fireEvent.click(front);

    expect(onSwipeUp).toHaveBeenCalledOnce();
    expect(onFrontClick).not.toHaveBeenCalled();
  });

  it("ignores non-primary mouse drags on the front text", () => {
    const onSwipeUp = vi.fn();
    render(<StudySession onExit={vi.fn()} frontTextSlot={<div>Front</div>} onSwipeUp={onSwipeUp} />);
    const front = screen.getByText("Front");

    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 1);
    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 2);

    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("keeps a mouse drag from swiping or clicking the back text", () => {
    const onSwipeLeft = vi.fn();
    const onBackClick = vi.fn();
    render(
      <StudySession
        onExit={vi.fn()}
        showBackText
        backTextSlot={
          <button type="button" onClick={onBackClick}>
            Back
          </button>
        }
        onSwipeLeft={onSwipeLeft}
      />
    );
    const back = screen.getByRole("button", { name: "Back" });

    swipeWithMouse(back, { clientX: 200, clientY: 24 }, { clientX: 20, clientY: 24 });
    fireEvent.click(back);

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onBackClick).not.toHaveBeenCalled();
  });
});
