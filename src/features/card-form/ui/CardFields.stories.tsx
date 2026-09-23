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
      <CardFields categories={CATEGORY} preview={<BackText {...preview} />} form={form} />
      <button type="submit">Save</button>
    </form>
  );
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

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
    await step("STORYBOOK-CARD-FORM-01 Preserve front text across tabs", async () => {
      const frontText = canvas.getByRole("textbox", { name: "Front text" });
      await userEvent.clear(frontText);
      await userEvent.type(frontText, "Updated prompt");
      await expect(frontText).toHaveValue("Updated prompt");

      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated prompt");
    });
    await step("STORYBOOK-CARD-FORM-02 Select a tag", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      const firstTag = canvas.getByRole("checkbox", { name: "raw" });
      await expect(firstTag).not.toBeChecked();
      await userEvent.click(firstTag);
      await expect(firstTag).toBeChecked();
      await userEvent.click(canvas.getByRole("button", { name: "Done" }));
    });
  },
};
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...LongContent, globals: { theme: "dark" } };

export const Empty: Story = { args: { card: { ...fixture.card.default, frontText: "", backText: "", tags: [] } } };
export const Back: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
  },
};
export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
  },
};
export const ExpandedValidationError: Story = {
  ...Expanded,
  args: { card: { ...fixture.card.default, frontText: "", backText: "" }, validationError: true },
};
export const TagSelection: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
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
    await step("STORYBOOK-CARD-FORM-03 Japanese validation", async () => {
      await canvas.findByText("表面のテキストは必須です。");
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
    await step("STORYBOOK-CARD-FORM-04 Open answer preview", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
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
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
    await userEvent.click(within(canvas.getByRole("dialog")).getByRole("button", { name: "Preview answer" }));
  },
};

export const ExpandedDraft: Story = {
  args: { card: { ...fixture.card.default, frontText: "Front", backText: "Back" } },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-06 Preserve both drafts after expanded editing", async () => {
      await userEvent.clear(canvas.getByRole("textbox", { name: "Front text" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Updated front");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      const expanded = within(canvas.getByRole("dialog")).getByRole("textbox", { name: "Back text" });
      await userEvent.clear(expanded);
      await userEvent.type(expanded, "Updated back");
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("button", { name: "Expand Back" })).toHaveFocus();
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");
    });
  },
};

export const KeyboardTabs: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-08 Switch card sides with keyboard navigation", async () => {
      canvas.getByRole("tab", { name: "Front" }).focus();
      for (const [key, side] of [
        ["ArrowRight", "Back"],
        ["Home", "Front"],
        ["End", "Back"],
        ["ArrowLeft", "Front"],
      ] as const) {
        await userEvent.keyboard(`{${key}}`);
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
    await step("STORYBOOK-CARD-FORM-12 Preview an incomplete draft without validation", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      const trigger = canvas.getByRole("button", { name: "Preview answer" });
      await userEvent.click(trigger);
      await expect(canvas.getByRole("region", { name: "Answer preview" })).toHaveTextContent("First Second");
      await userEvent.keyboard("{Enter}");
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("First\nSecond");
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("");
      await expect(args.onSubmit).not.toHaveBeenCalled();
    });
  },
};

export const CustomTagSubmission: Story = {
  args: { card: { ...fixture.card.default, frontText: "Front", backText: "Back", tags: ["language", "custom"] } },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-07 Preserve custom tags through reopening and submission", async () => {
      const editTags = canvas.getByRole("button", { name: "Edit tags" });
      await userEvent.click(editTags);
      const custom = canvas.getByRole("checkbox", { name: "custom" });
      await userEvent.click(custom);
      await expect(custom).not.toBeChecked();
      await userEvent.click(custom);
      await userEvent.click(canvas.getByRole("checkbox", { name: "math" }));
      await userEvent.click(canvas.getByRole("button", { name: "Done" }));
      await userEvent.click(editTags);
      await expect(canvas.getByRole("checkbox", { name: "math" })).toBeChecked();
      await userEvent.keyboard("{Escape}");
      await expect(editTags).toHaveFocus();
      await expect(editTags).toHaveAccessibleDescription("language, custom, math");
      await expect(canvas.getByText("+1", { exact: true })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
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
    await step("STORYBOOK-CARD-FORM-09 Reveal and describe the invalid back side", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      const back = canvas.getByRole("textbox", { name: "Back text" });
      await expect(canvas.getByRole("tab", { name: "Back" })).toHaveAttribute("aria-selected", "true");
      await waitFor(() => expect(back).toHaveFocus());
      await expect(back).toHaveAccessibleDescription("Back text is required.");
      await expect(args.onSubmit).not.toHaveBeenCalled();
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      const dialog = within(canvas.getByRole("dialog"));
      await expect(dialog.getByRole("textbox", { name: "Back text" })).toBeInvalid();
      await expect(dialog.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
        "Back text is required."
      );
      await expect(dialog.getByRole("alert")).toHaveTextContent("Back text is required.");
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Front");
    });
  },
};

export const PreviewLanguageChange: Story = {
  args: { languageControl: true },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-16 Keep the preview expanded after a language change", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
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
    await step("STORYBOOK-CARD-FORM-10 Translate unknown validation errors without losing expanded input", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Expand Front" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      const dialog = within(canvas.getByRole("dialog"));
      await expect(canvas.queryByText("private diagnostic")).not.toBeInTheDocument();
      await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveValue("Front");
      await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        "入力内容が正しくありません。"
      );
      await expect(dialog.getByRole("alert")).toHaveTextContent("入力内容が正しくありません。");
      await userEvent.click(dialog.getByRole("button", { name: "完了" }));
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
    await step("STORYBOOK-CARD-FORM-11 Correct the translated error without losing draft values", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      await expect(args.onSubmit).not.toHaveBeenCalled();
      await userEvent.click(canvas.getByRole("button", { name: "表面を拡大" }));
      const input = within(canvas.getByRole("dialog")).getByRole("textbox", { name: "表面のテキスト" });
      await expect(input).toHaveAccessibleDescription("表面のテキストは必須です。");
      await userEvent.type(input, "修正した問題");
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
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
    await step("STORYBOOK-CARD-FORM-13 Reflect expanded edits in the live math preview", async () => {
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
      await expect(within(preview).getByText("Draft").tagName).toBe("STRONG");
      await expect(preview.querySelector(".katex")).toBeVisible();
      await expect(within(preview).getByRole("table")).toBeVisible();
      await userEvent.clear(input);
      await userEvent.type(input, draft.replace("Draft", "Changed"));
      await expect(within(preview).getByText("Changed")).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue(draft.replace("Draft", "Changed"));
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("alert")).toHaveTextContent("Front text is required.");
    });
  },
};
function codeThemeStory(deckCategory: string, tags: string[], language: string, dark: boolean): Story {
  return {
    args: {
      deckCategory,
      dark,
      themeControl: true,
      card: { ...fixture.card.default, tags, backText: "const answer = 42;" },
    },
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-CARD-FORM-14 Respect category precedence and update the code theme", async () => {
        await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
        await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
        const preview = canvas.getByRole("region", { name: "Answer preview" });
        const code = preview.querySelector("code");
        await expect(code).toHaveAttribute("data-language", language);
        await expect(code).toHaveAttribute("data-theme", dark ? "dark" : "light");
        await expect(code).toHaveTextContent("const answer = 42;");
        await expect(preview.querySelector(".katex")).toBeNull();
        await userEvent.click(canvas.getByRole("button", { name: "Toggle theme" }));
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
    await step("STORYBOOK-CARD-FORM-15 Update an open preview when category tags change", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      await expect(preview.querySelector("code")).toHaveAttribute("data-language", "python");
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "python" }));
      await userEvent.click(canvas.getByRole("button", { name: "Done" }));
      await expect(within(preview).getByText("Draft").tagName).toBe("STRONG");
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "raw" }));
      await userEvent.click(canvas.getByRole("button", { name: "Done" }));
      await expect(preview).toHaveTextContent("**Draft**");
      await expect(preview.querySelector("strong")).toBeNull();
    });
  },
};
