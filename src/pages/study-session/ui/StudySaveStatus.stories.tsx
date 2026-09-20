import type { Meta, StoryObj } from "@storybook/react-vite";
import { StudySaveStatus } from "./StudySaveStatus";

const meta = {
  title: "Pages/Study Session/StudySaveStatus",
  component: StudySaveStatus,
  args: { saving: false, unreadable: false, onRetry: () => undefined },
} satisfies Meta<typeof StudySaveStatus>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Retry: Story = {};
export const Saving: Story = { args: { saving: true } };
export const Unreadable: Story = { args: { unreadable: true } };
