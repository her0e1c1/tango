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

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-02 Expand tags", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const disclosure = canvas.getByRole("button", { name: "Show 4 more tags" });
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(disclosure);

      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-13 Keep all selected tags in a bounded scrolling region", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const choices = canvas.getByRole("group", { name: "Tag choices" });
      // When: Evaluate `canvas.getAllByRole` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-14 Preserve the entire long tag name", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Evaluate `"averylongunbrokentag".repeat` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-03 Select a tag", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("checkbox", { name: "one" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSelectedTagsChange).toHaveBeenLastCalledWith(["one"]);
      await expect(canvas.queryByRole("combobox")).not.toBeInTheDocument();
    });
    await step("STORYBOOK-DECK-FILTER-05 Switch matching conditions", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("radio", { name: "All" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onMatchAllChange).toHaveBeenLastCalledWith(true);
      await expect(canvas.getByRole("radio", { name: "All" })).toBeChecked();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("radio", { name: "Any" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onMatchAllChange).toHaveBeenLastCalledWith(false);
      await expect(canvas.getByRole("radio", { name: "Any" })).toBeChecked();
    });
    await step("STORYBOOK-DECK-FILTER-10 Clear keeps focus on an enabled control", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Clear" })).toBeDisabled();
      await expect(canvas.getByRole("radio", { name: "Any" })).toHaveFocus();
    });
  },
};

export const DuplicateSelectionAdded: Story = {
  args: { tags: ["one", "two"], selectedTags: ["one", "one"] },
  play: async ({ canvas, userEvent, args, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-04 Add to a deduplicated selection", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getByText("1 selected")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Clear" })).toBeEnabled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("checkbox", { name: "two" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSelectedTagsChange).toHaveBeenLastCalledWith(["one", "two"]);
    });
  },
};

export const DuplicateSelectionRemoved: Story = {
  args: DuplicateSelectionAdded.args ?? {},
  play: async ({ canvas, userEvent, args, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-04 Remove all duplicate selections", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getByText("1 selected")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Clear" })).toBeEnabled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("checkbox", { name: "one" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSelectedTagsChange).toHaveBeenLastCalledWith([]);
    });
  },
};

export const KeyboardDisclosure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-07 Traverse revealed tags with the keyboard", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("button", { name: "Show 4 more tags" }).focus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Enter}");
      for (const tag of tags.slice(8)) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("checkbox", { name: tag })).toHaveFocus();
        // When: Exercise `userEvent.tab` with the prepared inputs.
        await userEvent.tab();
      }
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Show fewer tags" })).toHaveFocus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard(" ");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("checkbox")).toHaveLength(8);
      await expect(canvas.getByRole("button", { name: "Show 4 more tags" })).toHaveFocus();
    });
  },
};

export const RemoveHiddenSelection: Story = {
  args: { selectedTags: ["tag-12"] },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-08 Move focus when the deselected tag disappears", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("checkbox", { name: "tag-12" }).focus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard(" ");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("checkbox", { name: "tag-12" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("checkbox", { name: "tag-1" })).toHaveFocus();
    });
  },
};

export const RemoveStaleSelection: Story = {
  args: { tags: [], selectedTags: ["stale"] },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-09 Remove the last unavailable tag", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("checkbox", { name: "stale" }).focus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard(" ");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("checkbox")).not.toBeInTheDocument();
      await expect(canvas.getByRole("radio", { name: "Any" })).toHaveFocus();
    });
  },
};

export const EightChoices: Story = {
  args: { tags: tags.slice(0, 8) },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-11 Show all eight choices without disclosure", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Evaluate `canvas.getAllByRole` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-12 Preserve the matching condition without tags", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Evaluate `canvas.getByText` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-06 Keep selected and unavailable tags first", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
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
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Show 3 more tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "twelve" }));
      await userEvent.click(canvas.getByRole("button", { name: "Show fewer tags" }));
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-15 Preserve expansion after changing language", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Show 2 more tags" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "表示するタグを減らす" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      await expect(canvas.getByRole("checkbox", { name: "tag-9" })).toBeInTheDocument();
      await expect(canvas.getAllByRole("checkbox")).toHaveLength(10);
    });
  },
};

export const Tablet: Story = {
  args: {
    tags: manyTags.map((tag, index) => (index === 0 ? "Long tag name for a collection of study materials" : tag)),
    selectedTags: ["tag-2", "tag-3"],
  },
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("button", { name: /Show .* more tags/ }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Selected,
  decorators: [
    (StoryComponent) => (
      <div className="max-w-sm min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  parameters: { locale: "ja" },
  args: {
    tags: ["長い日本語の学習タグと復習する内容", "基礎", "応用"],
    selectedTags: ["基礎", "応用"],
    matchAll: true,
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
