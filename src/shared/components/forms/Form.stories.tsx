import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { Form as Template } from "@src/shared/components/forms/Form";
import { FormItem } from "@src/shared/components/forms/FormItem";

const meta = {
  title: "Shared/Form",
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
