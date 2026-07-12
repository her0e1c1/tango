import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { FullScreen as Template } from "@src/component/Molecule";
import { Container } from "@src/component/Decorator";

const meta = {
  title: "Molecule/FullScreen",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    className: "bg-gray-300",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "text" },
};

export const Center: Story = {
  args: {
    center: true,
    children: "this text should be displayed in center",
  },
};

export const InContainer: Story = {
  args: { children: "text" },
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};
