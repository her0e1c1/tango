import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { StudySaveControls } from "./StudySaveControls";

const meta = {
  title: "Pages/Study Session/StudySaveControls",
  component: StudySaveControls,
  args: { pending: false, onSkip: fn() },
} satisfies Meta<typeof StudySaveControls>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args, step }) => {
    await step("STORYBOOK-STUDY-CONTROLS-02 Skip card", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Skip" }));
      await expect(args.onSkip).toHaveBeenCalledOnce();
    });
  },
};
export const Saving: Story = { args: { pending: true } };
