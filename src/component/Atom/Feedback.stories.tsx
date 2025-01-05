import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { Feedback as Template } from "./Feedback";
import { AiOutlineArrowUp } from "react-icons/ai";

const meta = {
  title: "Atom/Feedback",
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
