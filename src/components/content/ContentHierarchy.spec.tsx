import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Card } from "@/components/content/Card";
import { Description } from "@/components/content/Description";
import { Section } from "@/components/content/Section";
import { Style } from "@/components/content/Style";
import { TagList } from "@/components/content/TagList";
import { Title } from "@/components/content/Title";

afterEach(cleanup);

describe("shared content hierarchy", () => {
  it("uses the Calm Focus surface hierarchy while retaining Card props", () => {
    const view = render(<Card className="custom-card">Card content</Card>);
    const surface = screen.getByText("Card content");
    expect(view.container.firstElementChild).toHaveClass("w-full", "md:w-1/2", "lg:w-1/3");
    expect(surface).toHaveClass("rounded-surface", "bg-surface", "text-ink", "shadow-surface", "custom-card");

    view.rerender(
      <Card full disabled border>
        Disabled card
      </Card>
    );
    expect(view.container.firstElementChild).toHaveClass("w-full");
    expect(screen.getByText("Disabled card")).toHaveClass("bg-surface-muted", "border", "border-border");
  });

  it("wraps long titles and retains keyboard click behavior", () => {
    const onClick = vi.fn();
    render(<Title onClick={onClick}>A continuous-title-that-must-wrap-on-narrow-screens</Title>);
    const title = screen.getByText(/continuous-title/);
    expect(title).toHaveClass("text-title", "text-ink", "min-w-0", "break-words");
    fireEvent.keyDown(title, { key: "Enter" });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("gives sections, descriptions, and styled text semantic type roles", () => {
    const view = render(
      <>
        <Section title="Section title" />
        <Description>Description text</Description>
        <Style>Styled text</Style>
      </>
    );
    expect(screen.getByText("Section title")).toHaveClass("text-body", "text-ink-muted", "border-border");
    expect(screen.getByText("Description text")).toHaveClass("text-caption", "text-ink-muted", "break-words");
    expect(screen.getByText("Styled text")).toHaveClass("text-ink", "break-words");
    expect(view.container).toHaveTextContent("Section titleDescription textStyled text");
  });

  it("wraps ordinary tag lists and constrains long lists without horizontal scrolling", () => {
    const view = render(<TagList>Tags</TagList>);
    expect(screen.getByText("Tags")).toHaveClass("flex-wrap", "min-w-0", "overflow-x-hidden");

    view.rerender(<TagList hasManyItems>Many tags</TagList>);
    expect(screen.getByText("Many tags")).toHaveClass("max-h-64", "flex-wrap", "overflow-y-auto");
    expect(screen.getByText("Many tags")).not.toHaveClass("flex-col", "flex-nowrap");
  });
});
