import type { Meta, StoryObj } from "@storybook/react";

import { Feedback as Template } from "@/shared/components/feedback/Feedback";
import { AiOutlineArrowUp } from "react-icons/ai";

const meta = {
  title: "Shared/Feedback/Feedback",
  component: Template,
  tags: ["autodocs"],
  args: {
    children: "",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArrowUp: Story = {
  args: { children: <AiOutlineArrowUp /> },
};

export const Success: Story = { args: { children: "Changes saved", tone: "success" } };
export const Warning: Story = { args: { children: "Connection is unstable", tone: "warning" } };
export const ErrorState: Story = { args: { children: "Could not save changes", tone: "error" } };
export const Dark: Story = {
  args: { children: "Dark-mode feedback", tone: "neutral" },
  globals: { theme: "dark" },
};
