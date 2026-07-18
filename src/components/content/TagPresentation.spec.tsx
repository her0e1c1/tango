import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RemovableTag } from "@/components/content/RemovableTag";
import { TagLabel } from "@/components/content/TagLabel";

describe("tag presentation", () => {
  afterEach(cleanup);

  it("renders compact read-only tag content outside the tab order", () => {
    render(<TagLabel label="TypeScript" />);

    const label = screen.getByText("TypeScript");
    const tag = label.parentElement;
    expect(tag).toHaveAttribute("title", "TypeScript");
    expect(tag).toHaveClass("rounded-control", "text-xs");
    expect(tag).not.toHaveAttribute("tabindex");
    expect(tag?.querySelector('[aria-hidden="true"]')).toHaveClass("rounded-pill", "bg-ink-muted");
  });

  it("removes one active filter through a native button", async () => {
    const onRemove = vi.fn();
    render(<RemovableTag label="TypeScript" onRemove={onRemove} />);

    const button = screen.getByRole("button", { name: "Remove TypeScript filter" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("min-h-touch", "rounded-control");
    expect(button).toHaveTextContent("×");

    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledExactlyOnceWith("TypeScript");
  });
});
