import type { Meta, StoryObj } from "@storybook/react";

import { Feedback } from "./Feedback";
import { AiOutlineArrowUp } from "react-icons/ai";

const meta = {
  title: "Shared/Feedback/Feedback",
  component: Feedback,
  tags: ["autodocs"],
  args: {
    children: "",
  },
} satisfies Meta<typeof Feedback>;

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
