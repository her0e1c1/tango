import type { Meta, StoryObj } from "@storybook/react-vite";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { StudyCompletion } from "./StudyCompletion";

const meta = {
  title: "Pages/Study Session/StudyCompletion",
  component: StudyCompletion,
  decorators: [withPageLayout],
  args: {
    cardCount: 12,
    onClickBack: () => undefined,
  },
} satisfies Meta<typeof StudyCompletion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleCard: Story = {
  args: { cardCount: 1 },
};
