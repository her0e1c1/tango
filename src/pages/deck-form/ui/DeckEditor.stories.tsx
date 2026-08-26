import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { DeckEditor } from "./DeckEditor";
import type { DeckFormProps } from "./DeckForm";

const longDeck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
  category: "value 3",
};

const createForm = (deck: typeof fixture.deck.default): DeckFormProps => ({
  deckInfo: {
    id: deck.id,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  },
  fields: {
    name: { defaultValue: deck.name },
    convertToBr: { checked: deck.convertToBr, onChange: fn() },
    localMode: { checked: deck.localMode, disabled: !deck.localMode, onChange: fn() },
    url: { defaultValue: deck.url },
    category: { defaultValue: deck.category, options: [{ label: deck.category, value: deck.category }] },
  },
  isLocalOnly: deck.localMode,
  remoteStorageAvailable: true,
  errors: { name: undefined, url: undefined },
  isSubmitting: false,
  onCancel: fn(),
  onSubmit: fn(),
});

const InteractiveDeckEditor: React.FC<React.ComponentProps<typeof DeckEditor>> = (props) => {
  const [convertToBr, setConvertToBr] = React.useState(Boolean(props.form.fields.convertToBr.checked));
  const [localMode, setLocalMode] = React.useState(Boolean(props.form.fields.localMode.checked));

  return (
    <DeckEditor
      {...props}
      form={{
        ...props.form,
        fields: {
          ...props.form.fields,
          convertToBr: {
            ...props.form.fields.convertToBr,
            checked: convertToBr,
            onChange: (event) => {
              props.form.fields.convertToBr.onChange?.(event);
              setConvertToBr(event.currentTarget.checked);
            },
          },
          localMode: {
            ...props.form.fields.localMode,
            checked: localMode,
            onChange: (event) => {
              props.form.fields.localMode.onChange?.(event);
              setLocalMode(event.currentTarget.checked);
            },
          },
        },
      }}
    />
  );
};

const meta = {
  title: "Pages/Deck Form/DeckEditor",
  component: DeckEditor,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    deckName: fixture.deck.default.name,
    form: createForm(fixture.deck.default),
    onDelete: fn(),
  },
  render: (args) => <InteractiveDeckEditor {...args} />,
} satisfies Meta<typeof DeckEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AnonymousLocalOnly: Story = {
  args: {
    form: {
      ...createForm(fixture.deck.default),
      fields: {
        ...createForm(fixture.deck.default).fields,
        localMode: { checked: true, disabled: true, onChange: fn() },
      },
      isLocalOnly: true,
      remoteStorageAvailable: false,
    },
  },
};
export const Interaction: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const checkbox = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Convert line breaks" });
    const initialValue = Boolean(args.form.fields.convertToBr.checked);

    await userEvent.click(checkbox);

    await expect(args.form.fields.convertToBr.onChange).toHaveBeenCalledOnce();
    await expect(checkbox.checked).toBe(!initialValue);
  },
};
export const Saving: Story = {
  args: { form: { ...createForm(fixture.deck.default), isSubmitting: true } },
};
export const ValidationError: Story = {
  args: {
    form: {
      ...createForm(fixture.deck.default),
      errors: { name: "Deck name is required.", url: "Enter a valid URL." },
    },
  },
};
export const SaveError: Story = { args: { saveError: new Error("Deck write failed") } };
export const LongValues: Story = { args: { deckName: longDeck.name, form: createForm(longDeck) } };
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...LongValues,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
