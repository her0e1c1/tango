/**
 * @file Verifies the "tag presentation" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders compact read-only
 * tag content outside the tab order", "removes one active filter through a native button".
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RemovableTag } from "@/components/content/RemovableTag";
import { TagLabel } from "@/components/content/TagLabel";

describe("tag presentation", () => {
  it("renders compact read-only tag content outside the tab order", () => {
    render(<TagLabel label="TypeScript" />);

    const tag = screen.getByTitle("TypeScript");
    expect(tag).toHaveAttribute("title", "TypeScript");
    expect(tag).toHaveClass("rounded-control", "text-xs");
    expect(tag).not.toHaveAttribute("tabindex");
    expect(tag).toHaveTextContent("TypeScript");
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
