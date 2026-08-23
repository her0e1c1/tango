import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { Form } from "./Form";
import { FormItem } from "./FormItem";
import { Input } from "./Input";
import { Switch } from "./Switch";

const reviewForm = () => (
  <Form div>
    <FormItem col label="Deck name" help="Shown in your library and study history.">
      <Input defaultValue="Japanese verbs" />
    </FormItem>
    <FormItem label="Shuffle cards" extra="The existing extra copy uses the same supporting hierarchy.">
      <Switch checked onChange={fn()} />
    </FormItem>
    <FormItem col label="Daily review target" help="Choose a value between 1 and 100." error="Enter a whole number.">
      <Input defaultValue="One hundred and twenty" />
    </FormItem>
  </Form>
);

const meta = {
  title: "Shared/Forms/Form",
  component: Form,
  tags: ["autodocs"],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => reviewForm(),
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-6">
      <div className="bg-canvas p-4 text-ink">{reviewForm()}</div>
      <div className="dark bg-canvas p-4 text-ink">{reviewForm()}</div>
    </div>
  ),
};

export const NarrowMobile: Story = {
  render: () => reviewForm(),
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
