import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { Form as Template, FormItem } from "./";

const meta = {
  title: "Molecule/Form",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <FormItem label="label" extra="this is extra" text>
          text
        </FormItem>
      </>
    ),
  },
};
