import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

import { Form } from "./Form";
import { FormItem } from "./FormItem";
import { Input } from "./Input";
import { Switch } from "./Switch";

const reviewForm = (idPrefix: string) => (
  <Form div>
    <FormItem col label="Deck name" inputId={`${idPrefix}-name`} help="Shown in your library and study history.">
      <Input id={`${idPrefix}-name`} defaultValue="Japanese verbs" />
    </FormItem>
    <FormItem
      label="Shuffle cards"
      inputId={`${idPrefix}-shuffle`}
      extra="The existing extra copy uses the same supporting hierarchy."
    >
      <Switch id={`${idPrefix}-shuffle`} checked onChange={fn()} />
    </FormItem>
    <FormItem
      col
      label="Daily review target"
      inputId={`${idPrefix}-target`}
      help="Choose a value between 1 and 100."
      error="Enter a whole number."
    >
      <Input id={`${idPrefix}-target`} defaultValue="One hundred and twenty" />
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
  render: () => reviewForm("storybook-form-default"),
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-6">
      <div className="bg-canvas p-4 text-ink">{reviewForm("storybook-form-light")}</div>
      <div className="dark bg-canvas p-4 text-ink">{reviewForm("storybook-form-dark")}</div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("textbox", { name: "Deck name" })).toHaveLength(2);
    await expect(canvas.getAllByRole("checkbox", { name: "Shuffle cards" })).toHaveLength(2);
    await expect(canvas.getAllByRole("textbox", { name: "Daily review target" })).toHaveLength(2);
  },
};

export const NarrowMobile: Story = {
  render: () => reviewForm("storybook-form-mobile"),
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
