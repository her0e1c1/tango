/** @file Verifies read-only and removable tags through their accessible interfaces. */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RemovableTag } from "./RemovableTag";
import { TagLabel } from "./TagLabel";

describe("tag presentation", () => {
  it("renders compact read-only tag content outside the tab order", () => {
    render(<TagLabel label="TypeScript" />);

    const tag = screen.getByTitle("TypeScript");
    expect(tag).toHaveAttribute("title", "TypeScript");
    expect(tag).not.toHaveAttribute("tabindex");
    expect(tag).toHaveTextContent("TypeScript");
  });

  it("removes one active filter through a native button", async () => {
    const onRemove = vi.fn();
    render(<RemovableTag label="TypeScript" onRemove={onRemove} />);

    const button = screen.getByRole("button", { name: "Remove TypeScript filter" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveTextContent("×");

    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledExactlyOnceWith("TypeScript");
  });
});
