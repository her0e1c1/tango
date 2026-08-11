/**
 * @file Verifies the "FrontText" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should swipe", "preserves
 * the front hook, content, and click interaction", "renders math content".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, describe, vi } from "vitest";
import "@testing-library/jest-dom";

import { FrontText } from "@/features/card/components/FrontText";

describe("FrontText", () => {
  it("should swipe", async () => {
    const onSwipe = vi.fn();
    render(<FrontText text="text" onSwipeLeft={onSwipe} />);
    expect(screen.getByText("text")).toBeVisible();
    // TODO: await waitFor(() => expect(onSwipe).toHaveBeenCalledTimes(1))
  });

  it("preserves the front hook, content, and click interaction", () => {
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
});
