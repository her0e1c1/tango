import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";

import { CATEGORY, type Deck } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";
import { Button } from "@/shared/ui/button";

import { DeckForm, type DeckFormFields } from "./DeckForm";

interface DeckFormStoryProps {
  deck: Deck;
  isLocalModeLocked: boolean;
  isSaving: boolean;
  mode: "create" | "edit";
  validationError: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

const DangerZone = ({ onDelete }: { onDelete: () => void }) => (
  <section
    aria-labelledby="delete-deck-heading"
    className="mt-section-gap rounded-surface border border-danger p-4 md:p-5"
  >
    <h2 id="delete-deck-heading" className="text-title font-semibold text-danger">
      Danger zone
    </h2>
    <p className="mt-1 text-body text-ink-muted">Permanently delete this deck, its cards, and study session.</p>
    <Button className="mt-4" variant="destructive" onClick={onDelete}>
      Delete deck
    </Button>
  </section>
);

const DeckFormStory = ({
  deck,
  isLocalModeLocked,
  isSaving,
  mode,
  validationError,
  onCancel,
  onDelete,
}: DeckFormStoryProps) => {
  const form = useForm<DeckFormFields>({
    defaultValues:
      mode === "create"
        ? { name: "", category: "", url: undefined, convertToBr: false, localMode: false }
        : {
            name: deck.name,
            category: deck.category,
            url: deck.url ?? undefined,
            convertToBr: deck.convertToBr,
            localMode: deck.localMode,
          },
  });

  useEffect(() => {
    if (validationError) {
      form.setError("name", { message: "Deck name is required." });
      form.setError("url", { message: "Enter a valid URL." });
    }
    if (mode === "create" && isSaving) void form.handleSubmit(() => new Promise(() => undefined))();
  }, [form, isSaving, mode, validationError]);

  const commonProps = {
    categories: CATEGORY,
    form,
    onCancel,
    onSubmit: form.handleSubmit(() => undefined),
  };

  if (mode === "create") {
    return <DeckForm {...commonProps} mode="create" isLocalModeLocked={isLocalModeLocked} />;
  }

  return (
    <DeckForm
      {...commonProps}
      mode="edit"
      deckInfo={{ id: deck.id, createdAt: deck.createdAt, updatedAt: deck.updatedAt }}
      deckName={deck.name}
      isLocalOnly={deck.localMode}
      isSaving={isSaving}
      afterForm={<DangerZone onDelete={onDelete} />}
    />
  );
};

const longDeck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
};

const meta = {
  title: "Features/Deck Form/DeckForm",
  component: DeckFormStory,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    deck: fixture.deck.default,
    isLocalModeLocked: false,
    isSaving: false,
    mode: "create",
    validationError: false,
    onCancel: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof DeckFormStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};
export const Edit: Story = { args: { mode: "edit" } };
export const LocalDeck: Story = {
  args: { mode: "edit", deck: { ...fixture.deck.default, localMode: true } },
};
export const ValidationError: Story = { args: { validationError: true } };
export const Creating: Story = { args: { isSaving: true } };
export const Saving: Story = { args: { mode: "edit", isSaving: true } };
export const LocalModeLocked: Story = { args: { isLocalModeLocked: true } };
export const LongContent: Story = { args: { mode: "edit", deck: longDeck } };
export const Interaction: Story = {
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.type(name, "New deck");
    await expect(name).toHaveValue("New deck");

    const category = canvas.getByRole("combobox");
    await userEvent.selectOptions(category, "math");
    await expect(category).toHaveValue("math");

    const sourceUrl = canvas.getByRole("textbox", { name: "Source URL" });
    await userEvent.type(sourceUrl, "https://example.com/deck.csv");
    await expect(sourceUrl).toHaveValue("https://example.com/deck.csv");

    const convertLineBreaks = canvas.getByRole("checkbox", { name: "Convert line breaks" });
    await userEvent.click(convertLineBreaks);
    await expect(convertLineBreaks).toBeChecked();

    const localOnly = canvas.getByRole("checkbox", { name: "Local only" });
    await userEvent.click(localOnly);
    await expect(localOnly).toBeChecked();
  },
};
export const Mobile: Story = {
  args: { mode: "edit", deck: longDeck },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas }) => {
    const storageSection = canvas.getByRole("region", { name: "Storage" });

    await expect(storageSection.scrollWidth).toBeLessThanOrEqual(storageSection.clientWidth);
  },
};
export const Dark: Story = { args: { mode: "edit", deck: longDeck }, globals: { theme: "dark" } };
