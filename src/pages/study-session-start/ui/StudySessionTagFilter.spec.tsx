import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { StudySessionTagFilter } from "./StudySessionTagFilter";

const tagNames = () => screen.getAllByRole<HTMLInputElement>("checkbox").map((checkbox) => checkbox.value);

const ControlledTagFilter: React.FC<{ tags: string[]; initialSelectedTags?: string[] }> = ({
  tags,
  initialSelectedTags = [],
}) => {
  const [selectedTags, setSelectedTags] = useState(initialSelectedTags);

  return (
    <StudySessionTagFilter
      tags={tags}
      selectedTags={selectedTags}
      matchAll={false}
      onSelectedTagsChange={setSelectedTags}
      onMatchAllChange={vi.fn()}
    />
  );
};

describe("StudySessionTagFilter", () => {
  it("reports tag, clear, and explicit match-mode changes with a deduplicated selection count", async () => {
    const user = userEvent.setup();
    const onSelectedTagsChange = vi.fn();
    const onMatchAllChange = vi.fn();
    const filter = (matchAll: boolean) => (
      <StudySessionTagFilter
        tags={["one", "two"]}
        selectedTags={["one", "one"]}
        matchAll={matchAll}
        onSelectedTagsChange={onSelectedTagsChange}
        onMatchAllChange={onMatchAllChange}
      />
    );
    const view = render(filter(false));

    const region = screen.getByRole("region", { name: "Tags" });
    expect(within(region).getByText("1 selected")).toBeVisible();
    expect(within(region).getByRole("group", { name: "Match" })).toBeVisible();
    expect(within(region).getByRole("radio", { name: "Any" })).toBeChecked();
    expect(within(region).getByRole("radio", { name: "All" })).not.toBeChecked();
    expect(within(region).getByRole("button", { name: "Clear" })).toBeEnabled();

    await user.click(within(region).getByRole("checkbox", { name: "two" }));
    await user.click(within(region).getByRole("checkbox", { name: "one" }));
    await user.click(within(region).getByRole("radio", { name: "All" }));
    view.rerender(filter(true));
    await user.click(within(region).getByRole("radio", { name: "Any" }));
    await user.click(within(region).getByRole("button", { name: "Clear" }));

    expect(onSelectedTagsChange).toHaveBeenNthCalledWith(1, ["one", "two"]);
    expect(onSelectedTagsChange).toHaveBeenNthCalledWith(2, []);
    expect(onSelectedTagsChange).toHaveBeenNthCalledWith(3, []);
    expect(onMatchAllChange).toHaveBeenNthCalledWith(1, true);
    expect(onMatchAllChange).toHaveBeenNthCalledWith(2, false);
  });

  it("keeps selected and stale tags first while progressively disclosing unselected tags", async () => {
    const user = userEvent.setup();
    const tags = [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "two",
    ];
    render(<ControlledTagFilter tags={tags} initialSelectedTags={["stale", "four", "stale"]} />);

    expect(tagNames()).toEqual(["stale", "four", "one", "two", "three", "five", "six", "seven", "eight", "nine"]);
    const showMore = screen.getByRole("button", { name: "Show 3 more tags" });
    expect(showMore).toHaveAttribute("aria-expanded", "false");
    expect(showMore).toHaveAttribute("aria-controls");

    await user.click(showMore);
    expect(screen.getByRole("button", { name: "Show fewer tags" })).toHaveAttribute("aria-expanded", "true");
    expect(tagNames()).toEqual([
      "stale",
      "four",
      "one",
      "two",
      "three",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
    ]);

    await user.click(screen.getByRole("checkbox", { name: "twelve" }));
    expect(tagNames().slice(0, 3)).toEqual(["stale", "four", "twelve"]);
    await user.click(screen.getByRole("button", { name: "Show fewer tags" }));

    expect(screen.getByRole("checkbox", { name: "twelve" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "twelve" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "ten" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "eleven" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show 2 more tags" })).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus to a remaining tag when deselection removes a collapsed chip", async () => {
    const user = userEvent.setup();
    const tags = Array.from({ length: 12 }, (_, index) => `tag-${String(index + 1)}`);
    render(<ControlledTagFilter tags={tags} initialSelectedTags={["tag-12"]} />);

    screen.getByRole("checkbox", { name: "tag-12" }).focus();
    await user.keyboard(" ");

    expect(screen.queryByRole("checkbox", { name: "tag-12" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "tag-1" })).toHaveFocus();
  });

  it("moves focus to the match controls when the last stale selected tag disappears", async () => {
    const user = userEvent.setup();
    render(<ControlledTagFilter tags={[]} initialSelectedTags={["stale"]} />);

    screen.getByRole("checkbox", { name: "stale" }).focus();
    await user.keyboard(" ");

    expect(screen.queryByRole("checkbox", { name: "stale" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Any" })).toHaveFocus();
  });

  it("moves focus before Clear disables itself", async () => {
    const user = userEvent.setup();
    render(<ControlledTagFilter tags={["one"]} initialSelectedTags={["one"]} />);

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Any" })).toHaveFocus();
  });

  it("omits disclosure when there are no more than eight unselected tags", () => {
    render(
      <StudySessionTagFilter
        tags={Array.from({ length: 8 }, (_, index) => `tag-${String(index + 1)}`)}
        selectedTags={[]}
        matchAll={false}
        onSelectedTagsChange={vi.fn()}
        onMatchAllChange={vi.fn()}
      />
    );

    expect(screen.getByText("No filter")).toBeVisible();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
  });

  it("shows a simple empty state when no tags are available", () => {
    render(
      <StudySessionTagFilter
        tags={[]}
        selectedTags={[]}
        matchAll={true}
        onSelectedTagsChange={vi.fn()}
        onMatchAllChange={vi.fn()}
      />
    );

    expect(screen.getByText("No tags available.")).toBeVisible();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "All" })).toBeChecked();
  });

  it("keeps a long tag available through its native checkbox", () => {
    const longTag = "averylongunbrokentag".repeat(12);
    render(
      <StudySessionTagFilter
        tags={[longTag]}
        selectedTags={[]}
        matchAll={false}
        onSelectedTagsChange={vi.fn()}
        onMatchAllChange={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox", { name: longTag })).toBeVisible();
  });
});
