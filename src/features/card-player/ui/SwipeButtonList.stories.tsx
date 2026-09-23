import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

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
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-CONTROLS-06 Request a direction with Enter", async () => {
      canvas.getByRole("button", { name: "Swipe left" }).focus();
      await userEvent.keyboard("{Enter}");
      await expect(args.onClickLeft).toHaveBeenCalledOnce();
    });
  },
};

export const DisabledDirectionKeyboard: Story = {
  args: { disabledDirections: { cardSwipeLeft: true }, onClickLeft: fn() },
  render: (args) => (
    <>
      <button type="button">Before directions</button>
      <SwipeButtonList {...args} />
    </>
  ),
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-CONTROLS-05 Skip disabled directions in tab order", async () => {
      const left = canvas.getByRole("button", { name: "Swipe left" });
      await expect(left).toBeVisible();
      await userEvent.click(left);
      await expect(args.onClickLeft).not.toHaveBeenCalled();
      canvas.getByRole("button", { name: "Before directions" }).focus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Swipe up" })).toHaveFocus();
    });
  },
};
