import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { fn } from "storybook/test";

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

export const Expanded: Story = {};

export const Selected: Story = {
  args: { selectedTags: ["tag-12", "tag-3"], matchAll: true },
};

export const AllSelectedManyTags: Story = {
  args: { tags: manyTags, selectedTags: manyTags, matchAll: true },
};

export const Empty: Story = {
  args: { tags: [] },
};

export const LongTag: Story = {
  args: { tags: ["averylongunbrokentag".repeat(12)] },
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
};

export const DuplicateSelectionAdded: Story = {
  args: { tags: ["one", "two"], selectedTags: ["one", "one"] },
};

export const DuplicateSelectionRemoved: Story = {
  args: DuplicateSelectionAdded.args ?? {},
};

export const KeyboardDisclosure: Story = {};

export const RemoveHiddenSelection: Story = {
  args: { selectedTags: ["tag-12"] },
};

export const RemoveStaleSelection: Story = {
  args: { tags: [], selectedTags: ["stale"] },
};

export const EightChoices: Story = {
  args: { tags: tags.slice(0, 8) },
};

export const EmptyAll: Story = {
  args: { tags: [], matchAll: true },
};

export const UnavailableAndDuplicateChoices: Story = {
  args: {
    tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "two"],
    selectedTags: ["stale", "four", "stale"],
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
};

export const Tablet: Story = {
  args: {
    tags: manyTags.map((tag, index) => (index === 0 ? "Long tag name for a collection of study materials" : tag)),
    selectedTags: ["tag-2", "tag-3"],
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
