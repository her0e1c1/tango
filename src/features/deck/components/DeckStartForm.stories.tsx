import type { Meta, StoryObj } from "@storybook/react";

import { DeckStartForm as Template, type DeckStartFormProps } from "@src/features/deck/components/DeckStartForm";
import * as fixture from "@src/shared/storybook/fixture";

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
