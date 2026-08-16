/**
 * @file Verifies the "TagFilter" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "groups tag controls and
 * exposes the active mode and selected tags", "preserves tag, mode, all, and clear callbacks",
 * "renders a long tag through its native checkbox".
 */

import { render, within, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { TagFilter } from "./TagFilter";

describe("TagFilter", () => {
  it("groups tag controls and exposes the active mode and selected tags", () => {
    render(<TagFilter tags={["one", "two"]} selectedTags={["two"]} tagAndFilter />);
    const tagsRegion = screen.getByRole("region", { name: "Tags" });

    expect(within(tagsRegion).getByText("AND")).toBeInTheDocument();
    expect(within(tagsRegion).getByRole("checkbox", { name: "Match all selected tags" })).toBeChecked();
    expect(within(tagsRegion).getByRole("checkbox", { name: "one" })).not.toBeChecked();
    expect(within(tagsRegion).getByRole("checkbox", { name: "two" })).toBeChecked();
  });

  it("preserves tag, mode, all, and clear callbacks", async () => {
    const onClickTag = vi.fn();
    const onClickFilter = vi.fn();
    const onClickAll = vi.fn();
    const onClickClear = vi.fn();
    render(
      <TagFilter
        tags={["one", "two"]}
        selectedTags={["one"]}
        tagAndFilter={false}
        onClickTag={onClickTag}
        onClickFilter={onClickFilter}
        onClickAll={onClickAll}
        onClickClear={onClickClear}
      />
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "two" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "one" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Match all selected tags" }));
    await userEvent.click(screen.getByRole("button", { name: "All" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onClickTag).toHaveBeenNthCalledWith(1, ["one", "two"]);
    expect(onClickTag).toHaveBeenNthCalledWith(2, []);
    expect(onClickFilter).toHaveBeenCalledWith(true);
    expect(onClickAll).toHaveBeenCalledOnce();
    expect(onClickClear).toHaveBeenCalledOnce();
  });

  it("renders a long tag through its native checkbox", () => {
    const longTag = "averylongunbrokentag".repeat(8);
    render(<TagFilter tags={[longTag]} />);
    const input = screen.getByRole("checkbox", { name: longTag });

    expect(input).toBeVisible();
  });
});
