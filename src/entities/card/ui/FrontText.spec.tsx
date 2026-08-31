/**
 * @file Verifies the FrontText component through rendered content and user interactions.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { FrontText } from "./FrontText";

describe("SWIPE-28 FrontText", () => {
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

  it("restores focus when Study resumes after verification Retry", () => {
    render(<FrontText text="Recovered front" onClick={vi.fn()} autoFocus />);

    expect(screen.getByRole("button", { name: "Recovered front" })).toHaveFocus();
  });
});
