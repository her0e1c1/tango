import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { useLifecycles } from "react-use";
import { fn } from "storybook/test";

import { CATEGORY, type Deck } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";
import { Button } from "@/shared/ui/button";

import { DeckForm, type DeckFormFields } from "./DeckForm";

interface DeckFormStoryProps {
  deck: Deck;
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

const noErrors: FieldErrors<DeckFormFields> = {};
const invalidName: FieldErrors<DeckFormFields> = { name: { type: "too_small", message: "Deck name is required." } };

function PendingDeckSave({ form }: { form: UseFormReturn<DeckFormFields> }) {
  const finish = useRef<(() => void) | undefined>(undefined);
  useLifecycles(
    () => {
      const pending = Promise.withResolvers<void>();
      finish.current = pending.resolve;
      void form.handleSubmit(() => pending.promise)();
    },
    () => finish.current?.()
  );
  return null;
}

const DeckFormStory = ({ deck, isSaving, mode, validationError, onCancel, onDelete }: DeckFormStoryProps) => {
  const form = useForm<DeckFormFields>({
    defaultValues:
      mode === "create"
        ? { name: "", category: "" }
        : {
            name: deck.name,
            category: deck.category,
          },
    errors: validationError ? invalidName : noErrors,
  });

  const commonProps = {
    categories: CATEGORY,
    form,
    onCancel,
    onSubmit: form.handleSubmit(() => undefined),
  };

  return (
    <>
      {mode === "create" ? (
        <DeckForm {...commonProps} mode="create" />
      ) : (
        <DeckForm
          {...commonProps}
          mode="edit"
          deckInfo={{ id: deck.id, createdAt: deck.createdAt, updatedAt: deck.updatedAt }}
          deckName={deck.name}
          afterForm={<DangerZone onDelete={onDelete} />}
        />
      )}
      {isSaving ? <PendingDeckSave form={form} /> : null}
    </>
  );
};

const longDeck = {
  ...fixture.deck.tooLongName,
};

const meta = {
  title: "Features/Deck Form/DeckForm",
  component: DeckFormStory,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    deck: fixture.deck.default,
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
export const ValidationError: Story = { args: { validationError: true } };
export const Creating: Story = { args: { isSaving: true } };
export const Saving: Story = { args: { mode: "edit", isSaving: true } };
export const LongContent: Story = { args: { mode: "edit", deck: longDeck } };
export const Interaction: Story = {};
export const Mobile: Story = {
  args: { mode: "edit", deck: longDeck },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Dark: Story = { args: { mode: "edit", deck: longDeck }, globals: { theme: "dark" } };

export const MobileCreate: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const JapaneseMobileCreate: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Tablet: Story = {
  ...LongContent,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...LongContent,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...LongContent,
  args: { ...LongContent.args, validationError: true },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const DarkSaving: Story = {
  args: { mode: "edit", isSaving: true },
  argTypes: { mode: { control: "radio", options: ["create", "edit"] } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
