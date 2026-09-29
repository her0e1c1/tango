import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { DeckFilterForm } from "./DeckFilterForm";
import * as fixture from "@/storybook/fixture";

type DeckFilterFormProps = React.ComponentProps<typeof DeckFilterForm>;

const args: DeckFilterFormProps = {
  tags: [...fixture.tags.default],
  selectedTags: [],
  tagAndFilter: false,
  setSelectedTags: fn(),
  setTagAndFilter: fn(),
};

const InteractiveDeckFilterForm: React.FC<DeckFilterFormProps> = (props) => {
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags);
  const [tagAndFilter, setTagAndFilter] = React.useState(props.tagAndFilter);

  return (
    <DeckFilterForm
      {...props}
      selectedTags={selectedTags}
      tagAndFilter={tagAndFilter}
      setSelectedTags={(value) => {
        props.setSelectedTags(value);
        setSelectedTags(value);
      }}
      setTagAndFilter={(value) => {
        props.setTagAndFilter(value);
        setTagAndFilter(value);
      }}
    />
  );
};

const meta = {
  title: "Features/Deck Filter/DeckFilterForm",
  component: DeckFilterForm,
  tags: ["autodocs"],
  args,
  render: (storyArgs) => <InteractiveDeckFilterForm {...storyArgs} />,
} satisfies Meta<typeof DeckFilterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interaction: Story = {
  args: { selectedTags: ["tag 1"] },
  play: async ({ args: storyArgs, canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FILTER-01 Clear selected tags", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
      await expect(storyArgs.setSelectedTags).toHaveBeenCalledWith([]);
      await expect(canvas.getByRole("checkbox", { name: "tag 1" })).not.toBeChecked();
    });
  },
};

export const ManyTagsSelected: Story = {
  args: {
    tags: Array.from({ length: 40 }, (_, index) => `study-tag-${index + 1}`),
    selectedTags: ["study-tag-2", "study-tag-17", "study-tag-31"],
    tagAndFilter: true,
  },
};

export const NoMatchCompatible: Story = {
  args: {
    selectedTags: ["advanced", "review"],
    tagAndFilter: true,
  },
};

export const Mobile: Story = {
  ...ManyTagsSelected,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = { ...ManyTagsSelected, globals: { theme: "dark" } };

export const Tablet: Story = {
  ...ManyTagsSelected,
  args: {
    ...ManyTagsSelected.args,
    tags: Array.from({ length: 40 }, (_, index) => `Long study tag for collection ${index + 1}`),
    selectedTags: [
      "Long study tag for collection 2",
      "Long study tag for collection 17",
      "Long study tag for collection 31",
    ],
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...ManyTagsSelected,
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
  ...Tablet,
  args: {
    ...Tablet.args,
    selectedTags: ["Unavailable selected tag", "Long study tag for collection 1"],
    tagAndFilter: true,
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
