import type { Meta, StoryObj } from "@storybook/react";

import { Form as Template } from "@/components/forms/Form";
import { FormItem } from "@/components/forms/FormItem";
import { Input } from "@/components/forms/Input";
import { Switch } from "@/components/forms/Switch";

const reviewForm = () => (
  <Template div>
    <FormItem col label="Deck name" help="Shown in your library and study history.">
      <Input defaultValue="Japanese verbs" />
    </FormItem>
    <FormItem label="Shuffle cards" extra="The existing extra copy uses the same supporting hierarchy.">
      <Switch checked onChange={() => undefined} />
    </FormItem>
    <FormItem col label="Daily review target" help="Choose a value between 1 and 100." error="Enter a whole number.">
      <Input defaultValue="One hundred and twenty" />
    </FormItem>
  </Template>
);

const meta = {
  title: "Shared/Forms/Form",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

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
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
