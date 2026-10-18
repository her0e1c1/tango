import { useCardTagForm } from "@/test/useCardTagForm";
import { useState } from "react";
import { useCardPreviewContent } from "../model/queries/useCardPreviewContent";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { expect, fn, waitFor, within } from "storybook/test";

import { BackText, cardContentInputSchema, type Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { CardFields, type CardFormFields } from "./CardFields";

interface CardFieldsStoryProps {
  card: Card;
  validationError: boolean;
  dark: boolean;
  onSubmit: (values: CardFormFields) => void;
  languageControl?: boolean;
  deckCategory?: string;
  themeControl?: boolean;
  unknownValidationError?: boolean;
}

const validationErrors = { frontText: { type: "custom" }, backText: { type: "custom" } };

const CardFieldsStory = ({
  card,
  validationError,
  dark,
  onSubmit,
  languageControl,
  deckCategory = "raw",
  themeControl,
  unknownValidationError,
}: CardFieldsStoryProps) => {
  const { i18n } = useTranslation();
  const [previewDark, setPreviewDark] = useState(dark);
  const form = useForm<CardFormFields>({
    resolver: zodResolver(cardContentInputSchema),
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
    ...(validationError
      ? {
          errors: unknownValidationError
            ? { frontText: { type: "unknown", message: "private diagnostic" } }
            : validationErrors,
        }
      : {}),
  });

  const preview = useCardPreviewContent(form.control, deckCategory, previewDark);
  return (
    <form
      className={`${previewDark ? "dark" : "light"} bg-surface text-ink`}
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
    >
      {Boolean(languageControl) && (
        <button type="button" onClick={() => void i18n.changeLanguage("ja")}>
          Japanese
        </button>
      )}
      {Boolean(themeControl) && (
        <button type="button" onClick={() => setPreviewDark(!previewDark)}>
          Toggle theme
        </button>
      )}
      <CardFields {...useCardTagForm(form)} availableTags={CATEGORY} preview={<BackText {...preview} />} form={form} />
      <button type="submit">Save</button>
    </form>
  );
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Features/Card Form/CardFields",
  component: CardFieldsStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { card: fixture.card.default, validationError: false, dark: false, onSubmit: fn() },
} satisfies Meta<typeof CardFieldsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ValidationError: Story = { args: { validationError: true } };
export const LongContent: Story = { args: { card: longCard } };
export const Interaction: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-01 Preserve front text across tabs", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const frontText = canvas.getByRole("textbox", { name: "Front text" });
      // When: Exercise `userEvent.clear` with the prepared inputs.
      await userEvent.clear(frontText);
      await userEvent.type(frontText, "Updated prompt");
      // Then: Verify the expected result in the assertions below.
      await expect(frontText).toHaveValue("Updated prompt");

      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated prompt");
    });
    await step("STORYBOOK-CARD-FORM-02 Select a tag", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      const firstTag = canvas.getByRole("checkbox", { name: "raw" });
      // Then: Verify the expected result in the assertions below.
      await expect(firstTag).not.toBeChecked();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(firstTag);
      // Then: Verify the expected result in the assertions below.
      await expect(firstTag).toBeChecked();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
    });
  },
};
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...LongContent, globals: { theme: "dark" } };

export const Empty: Story = { args: { card: { ...fixture.card.default, frontText: "", backText: "", tags: [] } } };
export const Back: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
};
export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
};
export const ExpandedValidationError: Story = {
  ...Expanded,
  args: { card: { ...fixture.card.default, frontText: "", backText: "" }, validationError: true },
};
export const TagSelection: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
};
export const MobileBack: Story = {
  ...Back,
  ...LongContent,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const JapaneseValidation: Story = {
  args: { validationError: true },
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-03 Japanese validation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await canvas.findByText("表面のテキストは必須です。");
      // When: Evaluate `canvas.getByRole` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        "表面のテキストは必須です。"
      );
      await expect(document.documentElement).toHaveAttribute("lang", "ja");
    });
  },
};

export const Preview: Story = {
  args: { card: { ...fixture.card.default, backText: "**Draft answer**\n\n$x^2$", tags: ["math"] } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-04 Open answer preview", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "Answer preview" })).toBeVisible();
    });
  },
};
export const MobilePreview: Story = { ...Preview, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const DarkCodePreview: Story = {
  ...Preview,
  args: { dark: true, card: { ...fixture.card.default, backText: "const answer = 42;", tags: ["typescript"] } },
  globals: { theme: "dark" },
};
export const ExpandedPreview: Story = {
  ...Preview,
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
    await userEvent.click(within(canvas.getByRole("dialog")).getByRole("button", { name: "Preview answer" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
};

export const ExpandedDraft: Story = {
  args: { card: { ...fixture.card.default, frontText: "Front", backText: "Back" } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-06 Preserve both drafts after expanded editing", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.clear` with the prepared inputs.
      await userEvent.clear(canvas.getByRole("textbox", { name: "Front text" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Updated front");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      const expanded = within(canvas.getByRole("dialog")).getByRole("textbox", { name: "Back text" });
      await userEvent.clear(expanded);
      await userEvent.type(expanded, "Updated back");
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Expand Back" })).toHaveFocus();
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");
    });
  },
};

export const KeyboardTabs: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-08 Switch card sides with keyboard navigation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("tab", { name: "Front" }).focus();
      for (const [key, side] of [
        ["ArrowRight", "Back"],
        ["Home", "Front"],
        ["End", "Back"],
        ["ArrowLeft", "Front"],
      ] as const) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `userEvent.keyboard` with the prepared inputs.
        await userEvent.keyboard(`{${key}}`);
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("tab", { name: side })).toHaveFocus();
        await expect(canvas.getByRole("tab", { name: side })).toHaveAttribute("aria-selected", "true");
        await expect(canvas.getByRole("textbox", { name: `${side} text` })).toBeVisible();
      }
    });
  },
};

export const IncompletePreview: Story = {
  args: { card: { ...fixture.card.default, frontText: "", backText: "First\nSecond", tags: ["raw"] } },
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-12 Preview an incomplete draft without validation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      const trigger = canvas.getByRole("button", { name: "Preview answer" });
      await userEvent.click(trigger);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "Answer preview" })).toHaveTextContent("First Second");
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Enter}");
      // Then: Verify the expected result in the assertions below.
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("First\nSecond");
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("");
      await expect(args.onSubmit).not.toHaveBeenCalled();
    });
  },
};

export const CustomTagSubmission: Story = {
  args: { card: { ...fixture.card.default, frontText: "Front", backText: "Back", tags: ["language", "custom"] } },
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-07 Preserve custom tags through reopening and submission", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const editTags = canvas.getByRole("button", { name: "Edit tags" });
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(editTags);
      const custom = canvas.getByRole("checkbox", { name: "custom" });
      await userEvent.click(custom);
      // Then: Verify the expected result in the assertions below.
      await expect(custom).not.toBeChecked();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(custom);
      await userEvent.click(canvas.getByRole("checkbox", { name: "math" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      await userEvent.click(editTags);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("checkbox", { name: "math" })).toBeChecked();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(editTags).toHaveFocus();
      await expect(editTags).toHaveAccessibleDescription("language, custom, math");
      await expect(canvas.getByText("+1", { exact: true })).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSubmit).toHaveBeenCalledWith({
        frontText: "Front",
        backText: "Back",
        tags: ["language", "custom", "math"],
      });
    });
  },
};

export const BackValidation: Story = {
  args: { card: { ...fixture.card.default, frontText: "Front", backText: "", tags: [] } },
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-09 Reveal and describe the invalid back side", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      const back = canvas.getByRole("textbox", { name: "Back text" });
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("tab", { name: "Back" })).toHaveAttribute("aria-selected", "true");
      await waitFor(() => expect(back).toHaveFocus());
      await expect(back).toHaveAccessibleDescription("Back text is required.");
      await expect(args.onSubmit).not.toHaveBeenCalled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      const dialog = within(canvas.getByRole("dialog"));
      // Then: Verify the expected result in the assertions below.
      await expect(dialog.getByRole("textbox", { name: "Back text" })).toBeInvalid();
      await expect(dialog.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
        "Back text is required."
      );
      await expect(dialog.getByRole("alert")).toHaveTextContent("Back text is required.");
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Front");
    });
  },
};

export const PreviewLanguageChange: Story = {
  args: { languageControl: true },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-16 Keep the preview expanded after a language change", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "解答プレビュー" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "プレビューを閉じる" })).toHaveAttribute("aria-expanded", "true");
    });
  },
};

export const UnknownErrorLanguage: Story = {
  args: {
    validationError: true,
    unknownValidationError: true,
    languageControl: true,
    card: { ...fixture.card.default, frontText: "Front" },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-10 Translate unknown validation errors without losing expanded input", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Expand Front" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      const dialog = within(canvas.getByRole("dialog"));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByText("private diagnostic")).not.toBeInTheDocument();
      await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveValue("Front");
      await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        "入力内容が正しくありません。"
      );
      await expect(dialog.getByRole("alert")).toHaveTextContent("入力内容が正しくありません。");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(dialog.getByRole("button", { name: "完了" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        "入力内容が正しくありません。"
      );
    });
  },
};
export const CorrectLocalizedDraft: Story = {
  args: {
    languageControl: true,
    card: { ...fixture.card.default, frontText: "", backText: "未保存の回答", tags: ["language", "custom"] },
  },
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-11 Correct the translated error without losing draft values", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSubmit).not.toHaveBeenCalled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "表面を拡大" }));
      const input = within(canvas.getByRole("dialog")).getByRole("textbox", { name: "表面のテキスト" });
      // Then: Verify the expected result in the assertions below.
      await expect(input).toHaveAccessibleDescription("表面のテキストは必須です。");
      // When: Exercise `userEvent.type` with the prepared inputs.
      await userEvent.type(input, "修正した問題");
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSubmit).toHaveBeenCalledWith({
        frontText: "修正した問題",
        backText: "未保存の回答",
        tags: ["language", "custom"],
      });
    });
  },
};
export const ExpandedMathDraft: Story = {
  args: { deckCategory: "math", card: { ...fixture.card.default, frontText: "", backText: "Original", tags: [] } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-13 Reflect expanded edits in the live math preview", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      const dialog = within(canvas.getByRole("dialog"));
      const input = dialog.getByRole("textbox", { name: "Back text" });
      const draft = "**Draft**\n\n$x^2$\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";
      await userEvent.clear(input);
      await userEvent.type(input, draft);
      await userEvent.click(dialog.getByRole("button", { name: "Preview answer" }));
      const preview = dialog.getByRole("region", { name: "Answer preview" });
      // Then: Verify the expected result in the assertions below.
      await expect(within(preview).getByText("Draft").tagName).toBe("STRONG");
      await expect(preview.querySelector(".katex")).toBeVisible();
      await expect(within(preview).getByRole("table")).toBeVisible();
      // When: Exercise `userEvent.clear` with the prepared inputs.
      await userEvent.clear(input);
      await userEvent.type(input, draft.replace("Draft", "Changed"));
      // Then: Verify the expected result in the assertions below.
      await expect(within(preview).getByText("Changed")).toBeVisible();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue(draft.replace("Draft", "Changed"));
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("alert")).toHaveTextContent("Front text is required.");
    });
  },
};
function codeThemeStory(deckCategory: string, tags: string[], language: string, dark: boolean): Story {
  // Given: Use this case's inputs and any shared test setup.
  // When: Evaluate `step` as part of the following checks.
  // Then: Verify the expected result in the assertions below.
  return {
    args: {
      deckCategory,
      dark,
      themeControl: true,
      card: { ...fixture.card.default, tags, backText: "const answer = 42;" },
    },
    play: async ({ canvas, userEvent, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step("STORYBOOK-CARD-FORM-14 Respect category precedence and update the code theme", async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
        await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
        const preview = canvas.getByRole("region", { name: "Answer preview" });
        const code = preview.querySelector("code");
        // Then: Verify the expected result in the assertions below.
        await expect(code).toHaveAttribute("data-language", language);
        await expect(code).toHaveAttribute("data-theme", dark ? "dark" : "light");
        await expect(code).toHaveTextContent("const answer = 42;");
        await expect(preview.querySelector(".katex")).toBeNull();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Toggle theme" }));
        // Then: Verify the expected result in the assertions below.
        await expect(code).toHaveAttribute("data-theme", dark ? "light" : "dark");
      });
    },
  };
}
export const DeckPythonPreview = codeThemeStory("python", [], "python", false);
export const TaggedTypescriptPreview = codeThemeStory("math", ["custom", "typescript", "python"], "typescript", true);
export const TaggedMarkdownPreview = codeThemeStory("math", ["md"], "md", false);
export const PreviewTagChanges: Story = {
  args: { deckCategory: "math", card: { ...fixture.card.default, tags: ["python"], backText: "**Draft**" } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-15 Update an open preview when category tags change", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      // Then: Verify the expected result in the assertions below.
      await expect(preview.querySelector("code")).toHaveAttribute("data-language", "python");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "python" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      // Then: Verify the expected result in the assertions below.
      await expect(within(preview).getByText("Draft").tagName).toBe("STRONG");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "raw" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      // Then: Verify the expected result in the assertions below.
      await expect(preview).toHaveTextContent("**Draft**");
      await expect(preview.querySelector("strong")).toBeNull();
    });
  },
};

export const DirectTagEditing: Story = {
  args: { card: { ...fixture.card.default, frontText: "Front", backText: "Back", tags: ["language", "custom"] } },
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-24 Edit tag drafts without confirmation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      const name = canvas.getByRole("textbox", { name: "Tag name 1" });
      await userEvent.clear(name);
      await userEvent.type(name, "renamed");
      // Then: Verify the expected result in the assertions below.
      await expect(name).toHaveFocus();
      await expect(name).toHaveValue("renamed");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Remove tag 2" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("textbox", { name: "Tag name 2" })).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Add tag" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Tag name 2" }), "new");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("alertdialog")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("button", { name: /^(Done|OK|Confirm)$/ })).not.toBeInTheDocument();
      await expect(args.onSubmit).not.toHaveBeenCalled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Edit tags" })).toHaveAccessibleDescription("renamed, new");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Tag name 1" })).toHaveValue("renamed");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSubmit).toHaveBeenCalledWith({
        frontText: "Front",
        backText: "Back",
        tags: ["renamed", "new"],
      });
    });
  },
};

export const InvalidTagNames: Story = {
  args: { card: { ...fixture.card.default, frontText: "Front", backText: "Back", tags: ["language", "custom"] } },
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-FORM-25 Reject blank and duplicate tag names until corrected", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("button", { name: "Add tag" }));
      const name = canvas.getByRole("textbox", { name: "Tag name 3" });
      await userEvent.type(name, " ");
      // Then: Verify the expected result in the assertions below.
      await expect(name).toHaveAccessibleDescription("Tag name is required.");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSubmit).not.toHaveBeenCalled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      const reopened = canvas.getByRole("textbox", { name: "Tag name 3" });
      await userEvent.clear(reopened);
      await userEvent.type(reopened, "custom");
      // Then: Verify the expected result in the assertions below.
      await expect(reopened).toHaveAccessibleDescription("Tag names must be unique.");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSubmit).not.toHaveBeenCalled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      const corrected = canvas.getByRole("textbox", { name: "Tag name 3" });
      await userEvent.clear(corrected);
      await userEvent.type(corrected, "new");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close tag editor" }));
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSubmit).toHaveBeenCalledWith({
        frontText: "Front",
        backText: "Back",
        tags: ["language", "custom", "new"],
      });
    });
  },
};

export const Tablet: Story = {
  ...LongContent,
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
  ...LongContent,
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
    const dialog = within(canvas.getByRole("dialog"));
    const previewButton = dialog.getByRole("button", { name: "Preview answer" });
    await step("STORYBOOK-CARD-EDIT-02 Keep focus inside expanded editing with a closed preview", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      previewButton.focus();
      // When: Exercise `userEvent.tab` with the prepared inputs.
      await userEvent.tab();
      // Then: Verify the expected result in the assertions below.
      await expect(dialog.getByRole("button", { name: "Done" })).toHaveFocus();
      // When: Exercise `userEvent.tab` with the prepared inputs.
      await userEvent.tab({ shift: true });
      // Then: Verify the expected result in the assertions below.
      await expect(previewButton).toHaveFocus();
    });
    await userEvent.click(previewButton);
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: {
    dark: true,
    validationError: true,
    deckCategory: "math",
    card: { ...longCard, tags: [...longCard.tags, "math"], backText: fixture.math.markdown },
  },
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const LandscapeExpanded: Story = {
  ...Desktop,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};
