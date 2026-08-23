import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import * as fixture from "@/storybook/fixture";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { DeckForm } from "./DeckForm";
import type { DeckFormProps } from "../model/useDeckFormState";

const createDeckForm = (deck: typeof fixture.deck.default): DeckFormProps => ({
  deckInfo: {
    id: deck.id,
    createdAt: "July 1, 2026",
    updatedAt: "July 14, 2026",
  },
  fields: {
    name: { defaultValue: deck.name },
    localMode: { checked: deck.localMode, disabled: !deck.localMode, onChange: fn() },
    category: {
      defaultValue: deck.category,
      options: [
        { label: "Markdown", value: "markdown" },
        { label: "Math", value: "math" },
        { label: "Python", value: "python" },
      ],
    },
    url: { defaultValue: deck.url },
    convertToBr: { checked: deck.convertToBr, onChange: fn() },
  },
  localModeHelp: deck.localMode
    ? "Turn off to save this deck and its cards to Firestore. This change cannot be undone."
    : "This deck and its cards are saved to Firestore.",
  errors: { name: undefined, url: undefined },
  isSubmitting: false,
  onCancel: fn(),
  onSubmit: fn(),
});

const DeckFormStory = (args: DeckFormProps) => {
  const [convertToBr, setConvertToBr] = useState(Boolean(args.fields.convertToBr.checked));

  return (
    <DeckForm
      {...args}
      fields={{
        ...args.fields,
        convertToBr: {
          ...args.fields.convertToBr,
          checked: convertToBr,
          onChange: (event) => {
            args.fields.convertToBr.onChange?.(event);
            setConvertToBr(event.target.checked);
          },
        },
      }}
    />
  );
};

const defaultForm = createDeckForm(fixture.deck.default);
const longForm = createDeckForm({
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
});

const meta = {
  title: "Pages/Deck Form/DeckForm",
  component: DeckForm,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: defaultForm,
} satisfies Meta<typeof DeckForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LocalDeck: Story = {
  args: {
    fields: {
      ...defaultForm.fields,
      localMode: { checked: true, onChange: fn() },
    },
    localModeHelp: "Turn off to save this deck and its cards to Firestore. This change cannot be undone.",
  },
};

export const ValidationError: Story = {
  args: {
    errors: {
      name: "Deck name is required.",
      url: "Enter a valid URL.",
    },
  },
};

export const Saving: Story = {
  args: { isSubmitting: true },
};

export const LongContent: Story = {
  args: longForm,
};

export const Interaction: Story = {
  render: (args) => <DeckFormStory {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const convertLineBreaks = canvas.getByRole("checkbox", { name: "Convert line breaks" });
    await userEvent.click(convertLineBreaks);
    await expect(convertLineBreaks).toBeChecked();

    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

export const Mobile: Story = {
  ...LongContent,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  ...LongContent,
  globals: { theme: "dark" },
};
