import { cleanup, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { TagFilter } from "@/features/deck/components/TagFilter";

describe("TagFilter", () => {
  afterEach(cleanup);

  it("groups tag controls and exposes the active mode and selected tags", () => {
    const view = render(<TagFilter tags={["one", "two"]} selectedTags={["two"]} tagAndFilter />);
    const tagsRegion = view.getByRole("region", { name: "Tags" });

    expect(tagsRegion).toHaveClass("bg-surface");
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
    const view = render(
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

    await userEvent.click(view.getByRole("checkbox", { name: "two" }));
    await userEvent.click(view.getByRole("checkbox", { name: "one" }));
    await userEvent.click(view.getByRole("checkbox", { name: "Match all selected tags" }));
    await userEvent.click(view.getByRole("button", { name: "All" }));
    await userEvent.click(view.getByRole("button", { name: "Clear" }));

    expect(onClickTag).toHaveBeenNthCalledWith(1, ["one", "two"]);
    expect(onClickTag).toHaveBeenNthCalledWith(2, []);
    expect(onClickFilter).toHaveBeenCalledWith(true);
    expect(onClickAll).toHaveBeenCalledOnce();
    expect(onClickClear).toHaveBeenCalledOnce();
  });
});
