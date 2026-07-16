import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { TagFilter } from "@/features/deck/components/TagFilter";

describe("TagFilter", () => {
  afterEach(cleanup);

  it("groups tag controls and exposes the active mode and selected tags", () => {
    const view = render(<TagFilter tags={["one", "two"]} selectedTags={["two"]} tagAndFilter />);

    expect(view.getByTestId("tag-filter")).toHaveClass("bg-surface");
    expect(view.getByTestId("tag-filter").tagName).toBe("DIV");
    expect(view.container.querySelector("fieldset, legend")).not.toBeInTheDocument();
    expect(view.getByText("tags")).toBeInTheDocument();
    expect(view.getByText("AND Filter")).toBeInTheDocument();
    expect(view.container.querySelector("input[name='tag-filter-click-filter']")).toBeChecked();
    expect(view.getByRole("checkbox", { name: "one" })).not.toBeChecked();
    expect(view.getByRole("checkbox", { name: "two" })).toBeChecked();
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
    await userEvent.click(view.container.querySelector("input[name='tag-filter-click-filter']") as Element);
    await userEvent.click(view.getByRole("button", { name: "All" }));
    await userEvent.click(view.getByRole("button", { name: "Clear" }));

    expect(onClickTag).toHaveBeenNthCalledWith(1, ["one", "two"]);
    expect(onClickTag).toHaveBeenNthCalledWith(2, []);
    expect(onClickFilter).toHaveBeenCalledWith(true);
    expect(onClickAll).toHaveBeenCalledOnce();
    expect(onClickClear).toHaveBeenCalledOnce();
  });
});
