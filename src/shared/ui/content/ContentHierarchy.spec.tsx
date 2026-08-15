/**
 * @file Verifies the "shared content hierarchy" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "uses the Calm Focus surface
 * hierarchy while retaining Card props", "wraps long titles and retains keyboard click behavior",
 * "gives sections, descriptions, and styled text semantic type roles".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Description, Style, TagList, Title } from "@/shared/ui/content";

const CONTINUOUS_TITLE_PATTERN = /continuous-title/;

describe("shared content hierarchy", () => {
  it("wraps long titles and retains keyboard click behavior", () => {
    const onClick = vi.fn();
    render(<Title onClick={onClick}>A continuous-title-that-must-wrap-on-narrow-screens</Title>);
    const title = screen.getByText(CONTINUOUS_TITLE_PATTERN);
    expect(title).toHaveClass("text-title", "text-ink", "min-w-0", "break-words");
    fireEvent.keyDown(title, { key: "Enter" });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("gives descriptions and styled text semantic type roles", () => {
    const view = render(
      <>
        <Description>Description text</Description>
        <Style>Styled text</Style>
      </>
    );
    expect(screen.getByText("Description text")).toHaveClass("text-caption", "text-ink-muted", "break-words");
    expect(screen.getByText("Styled text")).toHaveClass("text-ink", "break-words");
    expect(view.container).toHaveTextContent("Description textStyled text");
  });

  it("wraps ordinary tag lists and constrains long lists without horizontal scrolling", () => {
    const view = render(<TagList>Tags</TagList>);
    expect(screen.getByText("Tags")).toHaveClass("flex-wrap", "min-w-0", "overflow-x-hidden");

    view.rerender(<TagList hasManyItems>Many tags</TagList>);
    expect(screen.getByText("Many tags")).toHaveClass("max-h-64", "flex-wrap", "overflow-y-auto");
    expect(screen.getByText("Many tags")).not.toHaveClass("flex-col", "flex-nowrap");
  });
});
