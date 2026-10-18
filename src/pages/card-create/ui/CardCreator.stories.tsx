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
  initialValues?: CardFormFields;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: CardFormFields) => Promise<void>;
}

const CardCreatorStory = ({ initialValues, isSaving, onCancel, onSubmit }: CardCreatorStoryProps) => {
  const form = useForm<CardFormFields>({ defaultValues: initialValues ?? { frontText: "", backText: "", tags: [] } });

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

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-05 Submit card", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.type` with the prepared inputs.
      await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Hello");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Back text" }), "Hola");
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-17 Submit content and announce creation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await enterCreation(context);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(persistCard).toHaveBeenCalledWith(
        APP_STORY_UID,
        expect.objectContaining({
          frontText: "Front value",
          backText: "Back value",
          tags: [],
          deckId: creationDeck.id,
        })
      );
    });
  },
};
export const CreateRetry: Story = {
  beforeEach: prepareCreation,
  parameters: savingParameters,
  render: () => <SavingCreatorExample />,
  play: async (context) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-18 Keep both inputs after failure and retry explicitly", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(persistCard).mockRejectedValueOnce(new Error("rejected"));
      await enterCreation(context);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByText("Unable to create this card. Try again.")).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Back value");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Front value");
      // When: Exercise `userEvent.click` with the prepared inputs.
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
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const { canvas, userEvent, step } = context;
      await step("STORYBOOK-CARD-FORM-19 Disable repeated creation during validation and saving", async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        const pending = Promise.withResolvers<void>();
        try {
          // Given: Prepare `button` and any shared test state below.
          if (stage === "validation") validationGate.promise = pending.promise;
          else mocked(persistCard).mockReturnValue(pending.promise);
          await enterCreation(context);
          const button = canvas.getByRole("button", { name: "Create card" });
          // When: Exercise `fireEvent.click` with the prepared inputs.
          if (stage === "immediate") {
            await fireEvent.click(button);
            await fireEvent.click(button);
          } else await userEvent.dblClick(button);
          // Then: Verify the expected result in the assertions below.
          await expect(await canvas.findByRole("button", { name: "Creating…" })).toBeDisabled();
          // When: Exercise `userEvent.dblClick` with the prepared inputs.
          await userEvent.dblClick(button);
          // Then: Verify the expected result in the assertions below.
          if (stage === "validation") await expect(persistCard).not.toHaveBeenCalled();
          // When: Apply the operation or event under test.
          pending.resolve();
          // Then: Verify the expected result in the assertions below.
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

const longValues: CardFormFields = {
  frontText: "A long question with detailed context. ".repeat(20),
  backText: "An answer explaining the reasoning in detail. ".repeat(30),
  tags: ["Long tag describing the subject", "Vocabulary", "Review"],
};

export const Tablet: Story = {
  args: {
    initialValues: longValues,
  },
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: {
    initialValues: longValues,
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Desktop,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const DarkSaving: Story = {
  args: {
    initialValues: longValues,
    isSaving: true,
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
