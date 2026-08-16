/**
 * @file Verifies the FrontText component through rendered content and user interactions.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { FrontText } from "./FrontText";

const swipeLeft = (target: HTMLElement) => {
  const start = { identifier: 1, target, clientX: 200, clientY: 24 };
  const end = { identifier: 1, target, clientX: 20, clientY: 24 };

  fireEvent.touchStart(target, { touches: [start], targetTouches: [start], changedTouches: [start] });
  fireEvent.touchMove(target, { touches: [end], targetTouches: [end], changedTouches: [end] });
  fireEvent.touchEnd(target, { touches: [], targetTouches: [], changedTouches: [end] });
};

describe("FrontText", () => {
  it("reports a left swipe", () => {
    const onSwipeLeft = vi.fn();
    render(<FrontText text="Front" onSwipeLeft={onSwipeLeft} />);

    swipeLeft(screen.getByText("Front"));

    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it("preserves content and click interaction", () => {
    const onClick = vi.fn();
    render(<FrontText text="A very long front without spaces: abcdefghijklmnopqrstuvwxyz" onClick={onClick} />);
    const front = screen.getByText("A very long front without spaces: abcdefghijklmnopqrstuvwxyz");

    expect(front).toHaveTextContent("A very long front without spaces");
    expect(front).toBeVisible();
    fireEvent.click(front);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders math content", () => {
    render(<FrontText text="$x^2$" category="math" />);
    expect(screen.getByText("x^2")).toBeDefined();
  });

  it("activates FrontText with Enter", () => {
    const onClick = vi.fn();
    render(<FrontText text="Front" onClick={onClick} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Front" }), { key: "Enter" });

    expect(onClick).toHaveBeenCalledOnce();
  });
});
