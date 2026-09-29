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

export const Mobile: Story = {
  parameters: { locale: "ja" },
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const Dark: Story = {
  ...Default,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const MobileDark: Story = {
  ...Mobile,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
