/**
 * @file Verifies the "FrontText" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should swipe", "preserves
 * the front hook, content, and click interaction", "renders math content".
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { expect, it, describe, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";

import { FrontText } from "@/features/card/components/FrontText";

describe("FrontText", () => {
  afterEach(() => {
    cleanup();
  });
  it("should swipe", async () => {
    const onSwipe = vi.fn();
    const c = render(<FrontText text="text" onSwipeLeft={onSwipe} />);
    const t = c.container.querySelector("#frontText");
    expect(t).toBeVisible();
    // TODO: await waitFor(() => expect(onSwipe).toHaveBeenCalledTimes(1))
  });

  it("preserves the front hook, content, and click interaction", () => {
    const onClick = vi.fn();
    const view = render(
      <FrontText text="A very long front without spaces: abcdefghijklmnopqrstuvwxyz" onClick={onClick} />
    );
    const front = view.container.querySelector("#frontText");

    expect(front).toHaveTextContent("A very long front without spaces");
    expect(front).toHaveClass("max-w-reading");
    fireEvent.click(front as Element);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders math content", () => {
    const view = render(<FrontText text="$x^2$" category="math" />);
    expect(view.container.querySelector(".katex")).toBeInTheDocument();
  });
});
