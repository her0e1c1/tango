/**
 * @file Defines Storybook examples for Deck Form.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { DeckForm as Template, type DeckFormFields } from "@/features/deck/components/DeckForm";
import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

/**
 * Prepares fields for data for the Storybook examples in this file.
 * The helper keeps sample setup separate from the component configuration readers are meant to
 * inspect.
 */
const fieldsFor = (deck: Deck): DeckFormFields => ({
  name: { value: deck.name, onChange: () => undefined },
  convertToBr: { checked: Boolean(deck.convertToBr), onChange: () => undefined },
  url: { value: deck.url ?? "", onChange: () => undefined },
  category: {
    value: deck.category,
    options: fixture.form.options.default,
    onChange: () => undefined,
  },
});

const longDeck: Deck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
  category: "value 3",
};

/**
 * Renders the Interactive Deck Form Storybook example with local interactive state.
 * Local state lets readers try the component without connecting it to the full application.
 */
const InteractiveDeckForm = (props: React.ComponentProps<typeof Template>) => {
  const [name, setName] = React.useState(props.fields.name.value ?? "");

  return (
    <Template
      {...props}
      fields={{
        ...props.fields,
        name: {
          ...props.fields.name,
          value: name,
          onChange: (event) => {
            setName(event.target.value);
            props.fields.name.onChange?.(event);
          },
        },
      }}
    />
  );
};

const meta = {
  title: "Deck/DeckForm",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
  args: {
    deck: fixture.deck.default,
    fields: fieldsFor(fixture.deck.default),
    onCancel: () => undefined,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interaction: Story = {
  args: {
    fields: {
      ...fieldsFor(fixture.deck.default),
      name: { value: fixture.deck.default.name, onChange: fn() },
    },
    onSubmit: fn((event?: React.FormEvent<HTMLFormElement>) => event?.preventDefault()),
  },
  render: (args) => <InteractiveDeckForm {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const nameInput = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Interaction deck");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));

    await expect(nameInput).toHaveValue("Interaction deck");
    await expect(args.fields.name.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: "Interaction deck" }) })
    );
    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};

export const LongValues: Story = {
  args: { deck: longDeck, fields: fieldsFor(longDeck) },
};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const DarkReview: Story = {
  ...LongValues,
  globals: { theme: "dark" },
};

export const IphoneReview: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
