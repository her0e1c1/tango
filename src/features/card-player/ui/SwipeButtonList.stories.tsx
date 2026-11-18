import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { SwipeButtonList } from "./SwipeButtonList";

const meta = {
  title: "Features/Card Player/SwipeButtonList",
  component: SwipeButtonList,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SwipeButtonList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const PreviousDisabled: Story = { args: { disabledDirections: { cardSwipeLeft: true } } };
export const RemappedPreviousDisabled: Story = { args: { disabledDirections: { cardSwipeRight: true } } };
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: "dark" } };

export const Ratings: Story = {
  args: { captions: { cardSwipeLeft: "Again", cardSwipeDown: "Hard", cardSwipeRight: "Good", cardSwipeUp: "Easy" } },
};

export const KeyboardDirection: Story = {
  args: { onClickLeft: fn() },
};

export const DisabledDirectionKeyboard: Story = {
  args: { disabledDirections: { cardSwipeLeft: true }, onClickLeft: fn() },
  render: (args) => (
    <>
      <button type="button">Before directions</button>
      <SwipeButtonList {...args} />
    </>
  ),
};

export const Mobile: Story = {
  ...Ratings,
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...Ratings,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...PreviousDisabled,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Ratings,
  args: { ...Ratings.args, disabledDirections: { cardSwipeLeft: true } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
