import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import * as fixture from "@/storybook/fixture";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { CardForm, type CardFormProps } from "./CardForm";

const createCardForm = (card: typeof fixture.card.default): CardFormProps => ({
  cardInfo: {
    id: card.id,
    uniqueKey: card.uniqueKey,
    createdAt: "July 1, 2026",
    lastSeenAt: "July 14, 2026",
  },
  fields: {
    frontText: { defaultValue: card.frontText },
    backText: { defaultValue: card.backText },
    tags: card.tags.map((tag) => ({
      label: tag,
      value: tag,
      input: { checked: true, onChange: fn() },
    })),
  },
  errors: { frontText: undefined, backText: undefined },
  isSubmitting: false,
  onCancel: fn(),
  onSubmit: fn(),
});

const CardFormStory = (args: CardFormProps) => {
  const { defaultValue: defaultFrontText, ...frontTextField } = args.fields.frontText;
  const { defaultValue: defaultBackText, ...backTextField } = args.fields.backText;
  const [frontText, setFrontText] = useState(String(args.fields.frontText.value ?? defaultFrontText));
  const [backText, setBackText] = useState(String(args.fields.backText.value ?? defaultBackText));
  const [selectedTags, setSelectedTags] = useState(
    () => new Set(args.fields.tags.filter(({ input }) => input.checked).map(({ value }) => value))
  );
  const controlledFrontText = {
    ...frontTextField,
    value: frontText,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      args.fields.frontText.onChange?.(event);
      setFrontText(event.target.value);
    },
  };
  const controlledBackText = {
    ...backTextField,
    value: backText,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      args.fields.backText.onChange?.(event);
      setBackText(event.target.value);
    },
  };

  return (
    <CardForm
      {...args}
      fields={{
        ...args.fields,
        frontText: controlledFrontText,
        backText: controlledBackText,
        tags: args.fields.tags.map((tag) => ({
          ...tag,
          input: {
            ...tag.input,
            checked: selectedTags.has(tag.value),
            onChange: (event) => {
              tag.input.onChange?.(event);
              setSelectedTags((current) => {
                const next = new Set(current);
                if (event.target.checked) next.add(tag.value);
                else next.delete(tag.value);
                return next;
              });
            },
          },
        })),
      }}
    />
  );
};

const defaultForm = createCardForm(fixture.card.default);
const longForm = createCardForm({
  ...fixture.card.long,
  tags: [...fixture.tags.toolong],
});

const meta = {
  title: "Pages/Card Form/CardForm",
  component: CardForm,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: defaultForm,
} satisfies Meta<typeof CardForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationError: Story = {
  args: {
    errors: {
      frontText: "Front text is required.",
      backText: "Back text is required.",
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
  render: (args) => <CardFormStory {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const frontText = canvas.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Updated prompt");
    await expect(frontText).toHaveValue("Updated prompt");

    const firstTag = canvas.getByRole("checkbox", { name: "tag1" });
    await userEvent.click(firstTag);
    await expect(firstTag).not.toBeChecked();

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
