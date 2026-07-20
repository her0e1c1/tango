/**
 * @file Defines Storybook examples for Deck Start Form.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { DeckStartForm as Template, type DeckStartFormProps } from "@/features/deck/components/DeckStartForm";
import * as fixture from "@/storybook/fixture";

const args: DeckStartFormProps = {
  scoreMax: 1,
  scoreMin: -1,
  scoreMaxSwitchProps: { name: "scoreMaxSwitch", checked: true, onChange: () => undefined },
  scoreMinSwitchProps: { name: "scoreMinSwitch", checked: true, onChange: () => undefined },
  scoreMaxSliderProps: { name: "scoreMax", value: "1", min: -10, max: 10, onChange: () => undefined },
  scoreMinSliderProps: { name: "scoreMin", value: "-1", min: -10, max: 10, onChange: () => undefined },
  tagFilterProps: {
    tags: [...fixture.tags.default],
    selectedTags: [],
    tagAndFilter: false,
    onClickFilter: () => undefined,
    onClickAll: () => undefined,
    onClickClear: () => undefined,
    onClickTag: () => undefined,
  },
};

const meta = {
  title: "Deck/DeckStartForm",
  component: Template,
  tags: ["autodocs"],
  args,
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ManyTagsSelected: Story = {
  args: {
    tagFilterProps: {
      ...args.tagFilterProps,
      tags: Array.from({ length: 40 }, (_, index) => `study-tag-${index + 1}`),
      selectedTags: ["study-tag-2", "study-tag-17", "study-tag-31"],
      tagAndFilter: true,
    },
  },
};

export const NoMatchCompatible: Story = {
  args: {
    tagFilterProps: { ...args.tagFilterProps, selectedTags: ["advanced", "review"], tagAndFilter: true },
  },
};

export const Mobile: Story = {
  ...ManyTagsSelected,
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = { ...ManyTagsSelected, globals: { theme: "dark" } };
