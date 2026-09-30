import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { StudySaveControls } from "./StudySaveControls";

const meta = {
  title: "Pages/Study Session/StudySaveControls",
  component: StudySaveControls,
  tags: ["autodocs"],
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

export const Mobile: Story = {
  args: meta.args,
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  args: meta.args,
  decorators: [
    (StoryComponent) => (
      <div className="max-w-sm min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: meta.args,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const Dark: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <StudySaveControls {...args} />
      <StudySaveControls {...args} pending />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const MobileDark: Story = {
  ...Dark,
  parameters: { locale: "ja" },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
