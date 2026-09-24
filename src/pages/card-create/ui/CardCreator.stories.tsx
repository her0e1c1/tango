import { useCardTagForm } from "@/test/useCardTagForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { cardContentInputSchema } from "@/entities/card";
import { createCard as persistCard } from "@/entities/card";
import { APP_STORY_UID, prepareAppStory } from "@/storybook/appStory";
import { createDeck } from "@/test/factories";
import { ToastViewport } from "@/shared/ui/toast";
import { submit } from "../model/actions/submit";
import { BackText } from "@/entities/card";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect, fireEvent, fn, mocked, waitFor } from "storybook/test";

import { CATEGORY } from "@/entities/deck";
import { useCardPreviewContent, type CardFormFields } from "@/features/card-form";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { CardCreator } from "./CardCreator";

interface CardCreatorStoryProps {
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: CardFormFields) => Promise<void>;
}

const CardCreatorStory = ({ isSaving, onCancel, onSubmit }: CardCreatorStoryProps) => {
  const form = useForm<CardFormFields>({ defaultValues: { frontText: "", backText: "", tags: [] } });

  useEffect(() => {
    if (isSaving) void form.handleSubmit(() => new Promise(() => undefined))();
  }, [form, isSaving]);

  const preview = useCardPreviewContent(form.control, "raw", false);

  return (
    <CardCreator
      {...useCardTagForm(form)}
      availableTags={CATEGORY}
      preview={<BackText {...preview} />}
      deckName="Spanish vocabulary"
      form={form}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(onSubmit)}
    />
  );
};

const meta = {
  title: "Pages/Card Create/CardCreator",
  component: CardCreatorStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { isSaving: false, onCancel: fn(), onSubmit: fn() },
} satisfies Meta<typeof CardCreatorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = { args: { isSaving: true } };
export const Interaction: Story = {
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-05 Submit card", async () => {
      await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Hello");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Back text" }), "Hola");
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      await expect(args.onSubmit).toHaveBeenCalledOnce();
    });
  },
};
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };

const creationDeck = createDeck({ id: "create-story-deck", uid: APP_STORY_UID });
const validationGate: { promise: Promise<void> | undefined } = { promise: undefined };
function SavingCreatorExample() {
  const form = useForm<CardFormFields>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(
      cardContentInputSchema.superRefine(async () => {
        await validationGate.promise;
      })
    ),
  });
  const preview = useCardPreviewContent(form.control, "raw", false);
  return (
    <>
      <CardCreator
        {...useCardTagForm(form)}
        availableTags={CATEGORY}
        preview={<BackText {...preview} />}
        deckName={creationDeck.name}
        form={form}
        onCancel={() => undefined}
        onSubmit={form.handleSubmit(async (values) => {
          await submit({ deckId: creationDeck.id, values });
        })}
      />
      <ToastViewport />
    </>
  );
}
const savingParameters = { page: { path: "/", decks: [creationDeck] } };
const prepareCreation: NonNullable<Story["beforeEach"]> = async (context) => {
  const cleanup = await prepareAppStory(context);
  mocked(persistCard).mockResolvedValue(undefined);
  validationGate.promise = undefined;
  return () => {
    validationGate.promise = undefined;
    mocked(persistCard).mockReset();
    cleanup?.();
  };
};
const enterCreation: NonNullable<Story["play"]> = async ({ canvas, userEvent }) => {
  await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Front value");
  await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
  await userEvent.type(canvas.getByRole("textbox", { name: "Back text" }), "Back value");
};
export const CreateSuccess: Story = {
  beforeEach: prepareCreation,
  parameters: savingParameters,
  render: () => <SavingCreatorExample />,
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-17 Submit content and announce creation", async () => {
      await enterCreation(context);
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      await expect(persistCard).toHaveBeenCalledWith(
        APP_STORY_UID,
        expect.objectContaining({ frontText: "Front value", backText: "Back value", tags: [], deckId: creationDeck.id })
      );
    });
  },
};
export const CreateRetry: Story = {
  beforeEach: prepareCreation,
  parameters: savingParameters,
  render: () => <SavingCreatorExample />,
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-18 Keep both inputs after failure and retry explicitly", async () => {
      mocked(persistCard).mockRejectedValueOnce(new Error("rejected"));
      await enterCreation(context);
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      await expect(await canvas.findByText("Unable to create this card. Try again.")).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Back value");
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Front value");
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
    });
  },
};
function createPendingStory(stage: "immediate" | "validation" | "persistence"): Story {
  return {
    beforeEach: prepareCreation,
    parameters: savingParameters,
    render: () => <SavingCreatorExample />,
    play: async (context) => {
      const { canvas, userEvent, step } = context;
      await step("STORYBOOK-CARD-FORM-19 Disable repeated creation during validation and saving", async () => {
        const pending = Promise.withResolvers<void>();
        try {
          if (stage === "validation") validationGate.promise = pending.promise;
          else mocked(persistCard).mockReturnValue(pending.promise);
          await enterCreation(context);
          const button = canvas.getByRole("button", { name: "Create card" });
          if (stage === "immediate") {
            await fireEvent.click(button);
            await fireEvent.click(button);
          } else await userEvent.dblClick(button);
          await expect(await canvas.findByRole("button", { name: "Creating…" })).toBeDisabled();
          await userEvent.dblClick(button);
          if (stage === "validation") await expect(persistCard).not.toHaveBeenCalled();
          pending.resolve();
          await waitFor(() => expect(canvas.getByRole("button", { name: "Create card" })).toBeEnabled());
          await expect(persistCard).toHaveBeenCalledOnce();
        } finally {
          pending.resolve();
        }
      });
    },
  };
}
export const ImmediateRepeatedCreation = createPendingStory("immediate");
export const PendingCreationValidation = createPendingStory("validation");
export const PendingCreationSave = createPendingStory("persistence");
