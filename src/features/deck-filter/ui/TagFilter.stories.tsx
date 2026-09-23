import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { expect, fn } from "storybook/test";

import { TagFilter } from "./TagFilter";

type TagFilterProps = React.ComponentProps<typeof TagFilter>;

const tags = Array.from({ length: 12 }, (_, index) => `tag-${String(index + 1)}`);
const manyTags = Array.from({ length: 120 }, (_, index) => `tag-${String(index + 1)}`);

const InteractiveTagFilter: React.FC<TagFilterProps> = (props) => {
  const [matchAll, setMatchAll] = React.useState(props.matchAll);
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags);

  return (
    <TagFilter
      {...props}
      matchAll={matchAll}
      selectedTags={selectedTags}
      onMatchAllChange={(value) => {
        props.onMatchAllChange(value);
        setMatchAll(value);
      }}
      onSelectedTagsChange={(value) => {
        props.onSelectedTagsChange(value);
        setSelectedTags(value);
      }}
    />
  );
};

const meta = {
  title: "Features/Deck Filter/TagFilter",
  component: TagFilter,
  tags: ["autodocs"],
  args: {
    tags,
    selectedTags: [],
    matchAll: false,
    onSelectedTagsChange: fn(),
    onMatchAllChange: fn(),
  },
  render: (args) => <InteractiveTagFilter {...args} />,
} satisfies Meta<typeof TagFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FILTER-02 Expand tags", async () => {
      const disclosure = canvas.getByRole("button", { name: "Show 4 more tags" });
      await userEvent.click(disclosure);

      await expect(canvas.getAllByRole("checkbox")).toHaveLength(12);
      await expect(canvas.getByRole("button", { name: "Show fewer tags" })).toHaveAttribute("aria-expanded", "true");
    });
  },
};

export const Selected: Story = {
  args: { selectedTags: ["tag-12", "tag-3"], matchAll: true },
};

export const AllSelectedManyTags: Story = {
  args: { tags: manyTags, selectedTags: manyTags, matchAll: true },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-FILTER-13 Keep all selected tags in a bounded scrolling region", async () => {
      const choices = canvas.getByRole("group", { name: "Tag choices" });
      await expect(canvas.getAllByRole("checkbox", { checked: true })).toHaveLength(120);
      await expect(canvas.getByText("120 selected")).toBeVisible();
      await expect(getComputedStyle(choices).overflowY).toBe("auto");
      await expect(choices.scrollHeight).toBeGreaterThan(choices.clientHeight);
      await expect(canvas.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
    });
  },
};

export const Empty: Story = {
  args: { tags: [] },
};

export const LongTag: Story = {
  args: { tags: ["averylongunbrokentag".repeat(12)] },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-FILTER-14 Preserve the entire long tag name", async () => {
      await expect(canvas.getByRole("checkbox", { name: "averylongunbrokentag".repeat(12) })).toBeInTheDocument();
    });
  },
};

export const Mobile320: Story = {
  args: { selectedTags: ["tag-12", "tag-3"] },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  args: { selectedTags: ["tag-12", "tag-3"] },
  globals: { theme: "dark" },
};

export const Japanese: Story = {
  parameters: { locale: "ja" },
  args: {
    tags: [
      "基礎",
      "動詞",
      "名詞",
      "形容詞",
      "日常会話",
      "旅行",
      "ビジネス",
      "リスニング",
      "熟語",
      "前置詞",
      "発音",
      "復習",
    ],
    selectedTags: ["基礎", "動詞"],
  },
};

export const NarrowContainer: Story = {
  ...Japanese,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export const Selection: Story = {
  args: { tags: ["one", "two"] },
  play: async ({ canvas, userEvent, args, step }) => {
    await step("STORYBOOK-DECK-FILTER-03 Select a tag", async () => {
      await userEvent.click(canvas.getByRole("checkbox", { name: "one" }));
      await expect(args.onSelectedTagsChange).toHaveBeenLastCalledWith(["one"]);
      await expect(canvas.queryByRole("combobox")).not.toBeInTheDocument();
    });
    await step("STORYBOOK-DECK-FILTER-05 Switch matching conditions", async () => {
      await userEvent.click(canvas.getByRole("radio", { name: "All" }));
      await expect(args.onMatchAllChange).toHaveBeenLastCalledWith(true);
      await expect(canvas.getByRole("radio", { name: "All" })).toBeChecked();
      await userEvent.click(canvas.getByRole("radio", { name: "Any" }));
      await expect(args.onMatchAllChange).toHaveBeenLastCalledWith(false);
      await expect(canvas.getByRole("radio", { name: "Any" })).toBeChecked();
    });
    await step("STORYBOOK-DECK-FILTER-10 Clear keeps focus on an enabled control", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
      await expect(canvas.getByRole("button", { name: "Clear" })).toBeDisabled();
      await expect(canvas.getByRole("radio", { name: "Any" })).toHaveFocus();
    });
  },
};

export const DuplicateSelectionAdded: Story = {
  args: { tags: ["one", "two"], selectedTags: ["one", "one"] },
  play: async ({ canvas, userEvent, args, step }) => {
    await step("STORYBOOK-DECK-FILTER-04 Add to a deduplicated selection", async () => {
      await expect(canvas.getByText("1 selected")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Clear" })).toBeEnabled();
      await userEvent.click(canvas.getByRole("checkbox", { name: "two" }));
      await expect(args.onSelectedTagsChange).toHaveBeenLastCalledWith(["one", "two"]);
    });
  },
};

export const DuplicateSelectionRemoved: Story = {
  args: DuplicateSelectionAdded.args ?? {},
  play: async ({ canvas, userEvent, args, step }) => {
    await step("STORYBOOK-DECK-FILTER-04 Remove all duplicate selections", async () => {
      await expect(canvas.getByText("1 selected")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Clear" })).toBeEnabled();
      await userEvent.click(canvas.getByRole("checkbox", { name: "one" }));
      await expect(args.onSelectedTagsChange).toHaveBeenLastCalledWith([]);
    });
  },
};

export const KeyboardDisclosure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FILTER-07 Traverse revealed tags with the keyboard", async () => {
      canvas.getByRole("button", { name: "Show 4 more tags" }).focus();
      await userEvent.keyboard("{Enter}");
      for (const tag of tags.slice(8)) {
        await expect(canvas.getByRole("checkbox", { name: tag })).toHaveFocus();
        await userEvent.tab();
      }
      await expect(canvas.getByRole("button", { name: "Show fewer tags" })).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(canvas.getAllByRole("checkbox")).toHaveLength(8);
      await expect(canvas.getByRole("button", { name: "Show 4 more tags" })).toHaveFocus();
    });
  },
};

export const RemoveHiddenSelection: Story = {
  args: { selectedTags: ["tag-12"] },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FILTER-08 Move focus when the deselected tag disappears", async () => {
      canvas.getByRole("checkbox", { name: "tag-12" }).focus();
      await userEvent.keyboard(" ");
      await expect(canvas.queryByRole("checkbox", { name: "tag-12" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("checkbox", { name: "tag-1" })).toHaveFocus();
    });
  },
};

export const RemoveStaleSelection: Story = {
  args: { tags: [], selectedTags: ["stale"] },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FILTER-09 Remove the last unavailable tag", async () => {
      canvas.getByRole("checkbox", { name: "stale" }).focus();
      await userEvent.keyboard(" ");
      await expect(canvas.queryByRole("checkbox")).not.toBeInTheDocument();
      await expect(canvas.getByRole("radio", { name: "Any" })).toHaveFocus();
    });
  },
};

export const EightChoices: Story = {
  args: { tags: tags.slice(0, 8) },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-FILTER-11 Show all eight choices without disclosure", async () => {
      await expect(canvas.getAllByRole("checkbox")).toHaveLength(8);
      await expect(canvas.getByText("No filter")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Clear" })).toBeDisabled();
      await expect(canvas.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
    });
  },
};

export const EmptyAll: Story = {
  args: { tags: [], matchAll: true },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-FILTER-12 Preserve the matching condition without tags", async () => {
      await expect(canvas.getByText("No tags available.")).toBeVisible();
      await expect(canvas.getByRole("radio", { name: "All" })).toBeChecked();
      await expect(canvas.queryByRole("checkbox")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
    });
  },
};

export const UnavailableAndDuplicateChoices: Story = {
  args: {
    tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "two"],
    selectedTags: ["stale", "four", "stale"],
  },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FILTER-06 Keep selected and unavailable tags first", async () => {
      await expect(canvas.getAllByRole("checkbox").map((input) => input.getAttribute("value"))).toEqual([
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
      ]);
      await userEvent.click(canvas.getByRole("button", { name: "Show 3 more tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "twelve" }));
      await userEvent.click(canvas.getByRole("button", { name: "Show fewer tags" }));
      await expect(
        canvas
          .getAllByRole("checkbox")
          .slice(0, 3)
          .map((input) => input.getAttribute("value"))
      ).toEqual(["stale", "four", "twelve"]);
      await expect(canvas.getByRole("checkbox", { name: "twelve" })).toBeChecked();
      await expect(canvas.getByRole("button", { name: "Show 2 more tags" })).toHaveAttribute("aria-expanded", "false");
    });
  },
};

const LanguageSwitchingFilter = (args: TagFilterProps) => {
  const { i18n } = useTranslation();
  return (
    <>
      <button type="button" onClick={() => void i18n.changeLanguage("ja")}>
        Japanese
      </button>
      <InteractiveTagFilter {...args} />
    </>
  );
};

export const LanguageChange: Story = {
  args: { tags: tags.slice(0, 10) },
  render: (args) => <LanguageSwitchingFilter {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FILTER-15 Preserve expansion after changing language", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Show 2 more tags" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      await expect(canvas.getByRole("button", { name: "表示するタグを減らす" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      await expect(canvas.getByRole("checkbox", { name: "tag-9" })).toBeInTheDocument();
      await expect(canvas.getAllByRole("checkbox")).toHaveLength(10);
    });
  },
};
