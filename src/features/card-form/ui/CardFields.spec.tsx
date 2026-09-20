import { useCardPreviewContent } from "../model/queries/useCardPreviewContent";
import { actAsync } from "@/test/act";
import { getI18n } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type FieldErrors, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { BackText, cardContentInputSchema } from "@/entities/card";

import { CardFields, type CardFormFields } from "./CardFields";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const initialValues: CardFormFields = { frontText: "Front", backText: "Back", tags: ["language", "custom"] };

const FormHarness = ({
  onSubmit = vi.fn(),
  errors,
  values = initialValues,
  deckCategory = "raw",
  dark = false,
}: {
  onSubmit?: (values: CardFormFields) => void;
  errors?: FieldErrors<CardFormFields>;
  values?: CardFormFields;
  deckCategory?: string;
  dark?: boolean;
}) => {
  const form = useForm<CardFormFields>({
    defaultValues: values,
    resolver: zodResolver(cardContentInputSchema),
    ...(errors === undefined ? {} : { errors }),
  });
  const preview = useCardPreviewContent(form.control, deckCategory, dark);
  return (
    <form onSubmit={form.handleSubmit((validatedValues) => onSubmit(validatedValues))}>
      <CardFields
        categories={["language", "math", "python", "typescript", "md", "raw"]}
        preview={<BackText {...preview} />}
        form={form}
      />
      <button type="submit">Save</button>
      <output aria-label="Form status">
        {JSON.stringify({
          dirty: form.formState.isDirty,
          errors: form.formState.errors,
          submits: form.formState.submitCount,
        })}
      </output>
    </form>
  );
};

describe("CARD-03 CardFields editing", () => {
  it("keeps both drafts across tabs and expanded editing, then submits the selected tags", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    expect(screen.queryByRole("textbox", { name: "Back text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Front text" }));
    await user.type(screen.getByRole("textbox", { name: "Front text" }), "Updated front");
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const editor = screen.getByRole("dialog", { name: "Back text" });
    const expandedInput = within(editor).getByRole("textbox", { name: "Back text" });
    await user.clear(expandedInput);
    await user.type(expandedInput, "Updated back");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand Back" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
    await user.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");

    const tagsTrigger = screen.getByRole("button", { name: "Edit tags" });
    await user.click(tagsTrigger);
    const tagsDialog = screen.getByRole("dialog", { name: "Select tags" });
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "custom" }));
    expect(within(tagsDialog).getByRole("checkbox", { name: "custom" })).not.toBeChecked();
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "custom" }));
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "math" }));
    await user.click(within(tagsDialog).getByRole("button", { name: "Done" }));
    expect(tagsTrigger).toHaveFocus();
    expect(tagsTrigger).toHaveTextContent("+1");
    expect(tagsTrigger).toHaveAccessibleDescription("language, custom, math");
    await user.click(tagsTrigger);
    expect(screen.getByRole("checkbox", { name: "math" })).toBeChecked();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith({
      frontText: "Updated front",
      backText: "Updated back",
      tags: ["language", "custom", "math"],
    });
  });

  it("switches sides with arrow and endpoint keys while keeping tab focus", async () => {
    const user = userEvent.setup();
    render(<FormHarness />);
    const front = screen.getByRole("tab", { name: "Front" });
    const back = screen.getByRole("tab", { name: "Back" });
    await user.click(front);
    await user.keyboard("{ArrowRight}");
    expect(back).toHaveFocus();
    expect(back).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back");
    await user.keyboard("{Home}");
    expect(front).toHaveFocus();
    await user.keyboard("{End}");
    expect(back).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(front).toHaveFocus();
  });
});

describe("CARD-21 CardFields validation", () => {
  it("reveals and focuses an invalid Back while preserving the valid Front", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.clear(screen.getByRole("textbox", { name: "Back text" }));
    await user.click(screen.getByRole("tab", { name: "Front" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Back text is required.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Back" })).toHaveAttribute("aria-selected", "true");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const editor = screen.getByRole("dialog", { name: "Back text" });
    const expandedInput = within(editor).getByRole("textbox", { name: "Back text" });
    expect(expandedInput).toBeInvalid();
    expect(expandedInput).toHaveAccessibleDescription("Back text is required.");
    expect(within(editor).getByRole("alert")).toHaveTextContent("Back text is required.");
    expect(within(editor).getByRole("alert")).toBeVisible();
    await user.click(within(editor).getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front");
  });
});

describe("SETTINGS-08 Card validation language changes", () => {
  it("translates unknown validation errors in place, including the expanded editor", async () => {
    const user = userEvent.setup();
    render(<FormHarness errors={{ frontText: { type: "server", message: "Internal validation details" } }} />);
    const front = screen.getByRole("textbox", { name: "Front text" });
    expect(front).toHaveAccessibleDescription("The value is invalid.");
    expect(screen.getByRole("alert")).toHaveTextContent("The value is invalid.");
    await user.click(screen.getByRole("button", { name: "Expand Front" }));
    const expanded = within(screen.getByRole("dialog")).getByRole("textbox");
    expect(expanded).toHaveAccessibleDescription("The value is invalid.");

    await actAsync(() => getI18n().changeLanguage("ja"));

    expect(front).toHaveAccessibleDescription("入力内容が正しくありません。");
    expect(within(screen.getByRole("dialog")).getByRole("textbox")).toBe(expanded);
    expect(expanded).toHaveAccessibleDescription("入力内容が正しくありません。");
    expect(within(screen.getByRole("dialog")).getByRole("alert")).toHaveTextContent("入力内容が正しくありません。");
    expect(screen.queryByText("Internal validation details")).not.toBeInTheDocument();
    expect(front).toHaveValue("Front");
    expect(expanded).toHaveValue("Front");
  });

  it("updates an existing error without losing the other draft or custom tags", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.clear(screen.getByRole("textbox", { name: "Back text" }));
    await user.type(screen.getByRole("textbox", { name: "Back text" }), "未保存の回答");
    await user.click(screen.getByRole("tab", { name: "Front" }));
    const front = screen.getByRole("textbox", { name: "Front text" });
    await user.clear(front);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(front).toHaveAccessibleDescription("Front text is required.");
    await actAsync(() => getI18n().changeLanguage("ja"));
    expect(screen.getByRole("textbox", { name: "表面のテキスト" })).toBe(front);
    expect(front).toHaveValue("");
    expect(front).toHaveAccessibleDescription("表面のテキストは必須です。");
    expect(screen.getByRole("button", { name: "タグを編集" })).toHaveAccessibleDescription("language, custom");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "表面を拡大" }));
    expect(within(screen.getByRole("dialog")).getByRole("textbox")).toHaveAccessibleDescription(
      "表面のテキストは必須です。"
    );
    await user.keyboard("{Escape}");
    await user.type(front, "修正した問題");
    await user.click(screen.getByRole("tab", { name: "裏面" }));
    expect(screen.getByRole("textbox", { name: "裏面のテキスト" })).toHaveValue("未保存の回答");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith({
      frontText: "修正した問題",
      backText: "未保存の回答",
      tags: ["language", "custom"],
    });
  });
});

describe("CARD-30 CARD-31 unsaved answer preview", () => {
  it("previews an incomplete draft without submitting, validating, or replacing the input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} values={{ frontText: "", backText: "First\nSecond", tags: [] }} />);
    await user.click(screen.getByRole("tab", { name: "Back" }));
    const input = screen.getByRole("textbox", { name: "Back text" });
    const status = screen.getByLabelText("Form status").textContent;
    const trigger = screen.getByRole("button", { name: "Preview answer" });
    await user.click(trigger);
    expect(
      within(screen.getByRole("region", { name: "Answer preview" })).getByText("First Second", { selector: "pre" })
    ).toHaveTextContent("First Second");
    expect(screen.getByLabelText("Form status").textContent).toBe(status);
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("region", { name: "Answer preview" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Back text" })).toBe(input);
    expect(screen.getByLabelText("Form status").textContent).toBe(status);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders live math drafts and preserves validation, dirty state, and expanded input identity", async () => {
    const user = userEvent.setup();
    render(<FormHarness deckCategory="math" errors={{ frontText: { type: "custom" } }} />);
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByRole("textbox");
    await user.clear(input);
    await user.type(input, "**Draft**\n\n$x^2$\n\n| A | B |\n| - | - |\n| 1 | 2 |");
    const status = screen.getByLabelText("Form status").textContent;
    await user.click(within(dialog).getByRole("button", { name: "Preview answer" }));
    const preview = within(dialog).getByRole("region", { name: "Answer preview" });
    expect(within(preview).queryByRole("strong")).toHaveTextContent("Draft");
    expect(within(preview).getByRole("math", { hidden: true })).toBeInTheDocument();
    expect(within(preview).getByRole("table")).toBeInTheDocument();
    expect(screen.getByLabelText("Form status").textContent).toBe(status);
    await user.clear(input);
    await user.type(input, "**Changed**");
    expect(within(preview).queryByRole("strong")).toHaveTextContent("Changed");
    await user.click(within(dialog).getByRole("button", { name: "Hide preview" }));
    expect(within(dialog).getByRole("textbox")).toBe(input);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("**Changed**");
    await user.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription("Front text is required.");
  });

  it.each([
    { deckCategory: "python", tags: [], language: "python", dark: false },
    { deckCategory: "math", tags: ["custom", "typescript", "python"], language: "typescript", dark: true },
    { deckCategory: "math", tags: ["md"], language: "md", dark: false },
  ])("uses $language and dark=$dark from current rendering context", async ({ deckCategory, tags, language, dark }) => {
    const user = userEvent.setup();
    const values = { frontText: "", backText: "const answer = 42;", tags };
    const { rerender } = render(<FormHarness values={values} deckCategory={deckCategory} dark={dark} />);
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Preview answer" }));
    const preview = screen.getByRole("region", { name: "Answer preview" });
    expect(within(preview).getByRole("code")).toHaveAttribute("data-language", language);
    expect(within(preview).getByRole("code")).toHaveClass("hljs");
    expect(within(preview).getByRole("code")).toHaveAttribute("data-theme", dark ? "dark" : "light");
    expect(within(preview).queryByRole("math", { hidden: true })).toBeNull();
    rerender(<FormHarness values={values} deckCategory={deckCategory} dark={!dark} />);
    expect(within(preview).getByRole("code")).toHaveAttribute("data-theme", dark ? "light" : "dark");
  });

  it("updates an open preview when tags change and falls back to the Deck category", async () => {
    const user = userEvent.setup();
    render(<FormHarness deckCategory="math" values={{ frontText: "", backText: "**Draft**", tags: ["python"] }} />);
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Preview answer" }));
    const preview = screen.getByRole("region", { name: "Answer preview" });
    expect(within(preview).getByRole("code")).toHaveAttribute("data-language", "python");
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("checkbox", { name: "python" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(within(preview).queryByRole("strong")).toHaveTextContent("Draft");
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("checkbox", { name: "raw" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(within(preview).queryByRole("strong")).toBeNull();
    expect(within(preview).getByText("**Draft**", { selector: "pre" })).toHaveTextContent("**Draft**");
    await actAsync(() => getI18n().changeLanguage("ja"));
    expect(screen.getByRole("button", { name: "プレビューを閉じる" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "解答プレビュー" })).toBeInTheDocument();
  });
});
