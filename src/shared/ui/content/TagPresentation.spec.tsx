/** @file Verifies read-only and removable tags through their accessible interfaces. */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RemovableTag } from "./RemovableTag";
import { TagLabel } from "./TagLabel";

describe("tag presentation", () => {
  it("renders compact read-only tag content outside the tab order", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<TagLabel label="TypeScript" />);

    const tag = screen.getByTitle("TypeScript");
    // Then: Verify the expected result in the assertions below.
    expect(tag).toHaveAttribute("title", "TypeScript");
    expect(tag).not.toHaveAttribute("tabindex");
    expect(tag).toHaveTextContent("TypeScript");
  });

  it("removes one active filter through a native button", async () => {
    // Given: Prepare `onRemove`, `button` and any shared test state below.
    const onRemove = vi.fn();
    render(<RemovableTag label="TypeScript" onRemove={onRemove} />);

    const button = screen.getByRole("button", { name: "Remove TypeScript filter" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveTextContent("×");

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(button);
    // Then: Verify the expected result in the assertions below.
    expect(onRemove).toHaveBeenCalledExactlyOnceWith("TypeScript");
  });
});
