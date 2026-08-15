/**
 * @file Defines Storybook examples for Deck Filter Form.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";

import { DeckFilterForm as Template } from "./DeckFilterForm";
import * as fixture from "@/storybook/fixture";

type DeckFilterFormProps = ComponentProps<typeof Template>;

const args: DeckFilterFormProps = {
  scoreMax: 1,
  scoreMin: -1,
  tags: [...fixture.tags.default],
  selectedTags: [],
  tagAndFilter: false,
  setScoreMax: () => undefined,
  setScoreMin: () => undefined,
  setSelectedTags: () => undefined,
  setTagAndFilter: () => undefined,
};

const meta = {
  title: "Deck Filter/DeckFilterForm",
  component: Template,
  tags: ["autodocs"],
  args,
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

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
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = { ...ManyTagsSelected, globals: { theme: "dark" } };
