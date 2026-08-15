import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";
import { createStudyProgress } from "@/test/factories";
import { CardEditForm } from "./CardEditForm";

const longCard = {
  ...fixture.card.long,
  tags: [...fixture.tags.toolong],
};

const meta = {
  title: "Features/Card Edit/CardEditForm",
  component: CardEditForm,
  tags: ["autodocs"],
  parameters: {
    viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" },
  },
  args: {
    card: fixture.card.default,
    progress: createStudyProgress({ cardId: fixture.card.default.id }),
    onCancel: () => undefined,
    onSaved: () => undefined,
  },
} satisfies Meta<typeof CardEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongValues: Story = {
  args: { card: longCard, progress: createStudyProgress({ cardId: longCard.id }) },
};
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
