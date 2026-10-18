import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { SwipeButtonList } from "./SwipeButtonList";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-06 Request a direction with Enter", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("button", { name: "Swipe left" }).focus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Enter}");
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-05 Skip disabled directions in tab order", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const left = canvas.getByRole("button", { name: "Swipe left" });
      await expect(left).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(left);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onClickLeft).not.toHaveBeenCalled();
      // When: Exercise `canvas.getByRole("button", { name: "Before directions" }).focus` with the prepared inputs.
      canvas.getByRole("button", { name: "Before directions" }).focus();
      await userEvent.tab();
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Swipe up" })).toHaveFocus();
    });
  },
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
