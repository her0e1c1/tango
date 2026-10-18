import { useCardTagForm } from "@/test/useCardTagForm";
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
        {...useCardTagForm(form)}
        availableTags={["language", "math", "python", "typescript", "md", "raw"]}
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

describe("CARD-MANAGEMENT-01 CardFields editing", () => {
  it("keeps both drafts across tabs and expanded editing, then submits the selected tags", async () => {
    // Given: Prepare `user`, `onSubmit` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    expect(screen.queryByRole("textbox", { name: "Back text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    // When: Exercise `user.clear` with the prepared inputs.
    await user.clear(screen.getByRole("textbox", { name: "Front text" }));
    await user.type(screen.getByRole("textbox", { name: "Front text" }), "Updated front");
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const editor = screen.getByRole("dialog", { name: "Back text" });
    const expandedInput = within(editor).getByRole("textbox", { name: "Back text" });
    await user.clear(expandedInput);
    await user.type(expandedInput, "Updated back");
    await user.keyboard("{Escape}");
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand Back" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");

    const tagsTrigger = screen.getByRole("button", { name: "Edit tags" });
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(tagsTrigger);
    const tagsDialog = screen.getByRole("dialog", { name: "Select tags" });
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "custom" }));
    // Then: Verify the expected result in the assertions below.
    expect(within(tagsDialog).getByRole("checkbox", { name: "custom" })).not.toBeChecked();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "custom" }));
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "math" }));
    await user.click(within(tagsDialog).getByRole("button", { name: "Close tag editor" }));
    // Then: Verify the expected result in the assertions below.
    expect(tagsTrigger).toHaveFocus();
    expect(tagsTrigger).toHaveTextContent("+1");
    expect(tagsTrigger).toHaveAccessibleDescription("language, custom, math");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(tagsTrigger);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "math" })).toBeChecked();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledWith({
      frontText: "Updated front",
      backText: "Updated back",
      tags: ["language", "custom", "math"],
    });
  });

  it("switches sides with arrow and endpoint keys while keeping tab focus", async () => {
    // Given: Prepare `user`, `front`, `back` and any shared test state below.
    const user = userEvent.setup();
    render(<FormHarness />);
    const front = screen.getByRole("tab", { name: "Front" });
    const back = screen.getByRole("tab", { name: "Back" });
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(front);
    await user.keyboard("{ArrowRight}");
    // Then: Verify the expected result in the assertions below.
    expect(back).toHaveFocus();
    expect(back).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back");
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Home}");
    // Then: Verify the expected result in the assertions below.
    expect(front).toHaveFocus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{End}");
    // Then: Verify the expected result in the assertions below.
    expect(back).toHaveFocus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{ArrowLeft}");
    // Then: Verify the expected result in the assertions below.
    expect(front).toHaveFocus();
  });
});

describe("CARD-TAG-MANAGEMENT-01 CARD-TAG-MANAGEMENT-03 CardFields tag input", () => {
  it("removes a padded draft tag by clicking its candidate before leaving the input", async () => {
    // Given: Prepare `user`, `onSubmit`, `saved` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const saved = " custom ";
    render(<FormHarness onSubmit={onSubmit} values={{ ...initialValues, tags: [saved] }} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await user.type(screen.getByRole("textbox", { name: "Tag name 2" }), " new tag ");
    await user.click(within(screen.getByRole("dialog")).getByText("new tag", { exact: true }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("textbox", { name: "Tag name 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tag name 1" })).toHaveValue(saved);
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, tags: [saved] });
  });

  it("trims the edited name without losing a click on another candidate", async () => {
    // Given: Prepare `user`, `onSubmit` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} values={{ ...initialValues, tags: [] }} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await user.type(screen.getByRole("textbox", { name: "Tag name 1" }), " new tag ");
    await user.click(within(screen.getByRole("dialog")).getByText("math", { exact: true }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Tag name 1" })).toHaveValue("new tag");
    expect(screen.getByRole("checkbox", { name: "math" })).toBeChecked();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, tags: ["new tag", "math"] });
  });

  it("keeps the existing tag when the padded duplicate draft candidate is deselected", async () => {
    // Given: Prepare `user`, `onSubmit` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} values={{ ...initialValues, tags: ["custom"] }} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await user.type(screen.getByRole("textbox", { name: "Tag name 2" }), " custom ");
    await user.click(within(screen.getByRole("dialog")).getByText(" custom ", { normalizer: (text) => text }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("textbox", { name: "Tag name 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tag name 1" })).toHaveValue("custom");
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, tags: ["custom"] });
  });

  it.each(["Close tag editor", "Escape"])("trims edited input on %s while preserving literal tags", async (close) => {
    // Given: Prepare `user`, `onSubmit`, `saved` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const saved = " custom ";
    render(<FormHarness onSubmit={onSubmit} values={{ ...initialValues, tags: [saved] }} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("textbox", { name: "Tag name 1" }));
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Tag name 1" })).toHaveValue(saved);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("checkbox", { name: "custom" }));
    await user.click(screen.getByRole("checkbox", { name: "custom" }));
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    const input = screen.getByRole("textbox", { name: "Tag name 2" });
    await user.type(input, "  Mixed Case, e\u0301 日本語  ");
    // Then: Verify the expected result in the assertions below.
    expect(input).toHaveFocus();
    expect(input).toHaveValue("  Mixed Case, e\u0301 日本語  ");
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Enter}");
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).not.toHaveBeenCalled();
    // When: Exercise `user.keyboard` with the prepared inputs.
    if (close === "Escape") await user.keyboard("{Escape}");
    else await user.click(screen.getByRole("button", { name: close }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Edit tags" })).toHaveAccessibleDescription(
      "custom , Mixed Case, e\u0301 日本語"
    );
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, tags: [saved, "Mixed Case, e\u0301 日本語"] });
  });

  it.each([
    [" \t ", "Tag name is required."],
    [" custom ", "Tag names must be unique."],
  ])("rejects %j after trimming and accepts a correction", async (value, message) => {
    // Given: Prepare `user`, `onSubmit` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    const input = screen.getByRole("textbox", { name: "Tag name 3" });
    await user.type(input, value);
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(input).toHaveAccessibleDescription(message);
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).not.toHaveBeenCalled();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    const corrected = screen.getByRole("textbox", { name: "Tag name 3" });
    await user.clear(corrected);
    await user.type(corrected, " new tag ");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, tags: ["language", "custom", "new tag"] });
  });
});

describe("CARD-TAG-MANAGEMENT-01 CardFields tag save boundary", () => {
  it("preserves the tag and text drafts on Enter until the Card is explicitly saved", async () => {
    // Given: Prepare `user`, `onSubmit`, `front` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    const front = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `user.clear` with the prepared inputs.
    await user.clear(front);
    await user.type(front, "Updated front");
    await user.click(screen.getByRole("tab", { name: "Back" }));
    const back = screen.getByRole("textbox", { name: "Back text" });
    await user.clear(back);
    await user.type(back, "Updated back");
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    const dialog = screen.getByRole("dialog", { name: "Select tags" });
    const tagName = within(dialog).getByRole("textbox", { name: "Tag name 1" });
    await user.clear(tagName);
    await user.type(tagName, "renamed");

    await user.keyboard("{Enter}");

    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(dialog).toBeVisible();
    expect(tagName).toHaveFocus();
    expect(tagName).toHaveValue("renamed");
    expect(within(dialog).getByRole("textbox", { name: "Tag name 2" })).toHaveValue("custom");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(within(dialog).getByRole("button", { name: "Close tag editor" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Edit tags" })).toHaveAccessibleDescription("renamed, custom");
    expect(back).toHaveValue("Updated back");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(front).toHaveValue("Updated front");
    expect(onSubmit).not.toHaveBeenCalled();

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      frontText: "Updated front",
      backText: "Updated back",
      tags: ["renamed", "custom"],
    });
  });
});

describe("CARD-MANAGEMENT-10 CardFields validation", () => {
  it("shows both tab errors and clears only the corrected side before saving valid drafts", async () => {
    // Given: Prepare `user`, `onSubmit`, `frontTab` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    const frontTab = screen.getByRole("tab", { name: "Front" });
    const backTab = screen.getByRole("tab", { name: "Back" });
    expect(within(frontTab).queryByText("●")).not.toBeInTheDocument();
    expect(within(backTab).queryByText("●")).not.toBeInTheDocument();
    const front = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `user.clear` with the prepared inputs.
    await user.clear(front);
    await user.click(backTab);
    const back = screen.getByRole("textbox", { name: "Back text" });
    await user.clear(back);

    await user.click(screen.getByRole("button", { name: "Save" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(within(frontTab).getByText("●")).toBeVisible();
    expect(within(backTab).getByText("●")).toBeVisible();
    expect(frontTab).toHaveAccessibleDescription("Front text is required.");
    expect(backTab).toHaveAccessibleDescription("Back text is required.");
    expect(onSubmit).not.toHaveBeenCalled();

    // When: Exercise `user.type` with the prepared inputs.
    await user.type(front, "Corrected front");

    // Then: Verify the expected result in the assertions below.
    expect(within(frontTab).queryByText("●")).not.toBeInTheDocument();
    expect(frontTab).not.toHaveAccessibleDescription();
    expect(within(backTab).getByText("●")).toBeVisible();
    expect(backTab).toHaveAccessibleDescription("Back text is required.");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(backTab);
    // Then: Verify the expected result in the assertions below.
    expect(back).toHaveValue("");
    expect(back).toHaveAccessibleDescription("Back text is required.");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).not.toHaveBeenCalled();

    // When: Exercise `user.type` with the prepared inputs.
    await user.type(back, "Corrected back");

    // Then: Verify the expected result in the assertions below.
    expect(within(backTab).queryByText("●")).not.toBeInTheDocument();
    expect(backTab).not.toHaveAccessibleDescription();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      frontText: "Corrected front",
      backText: "Corrected back",
      tags: ["language", "custom"],
    });
    expect(backTab).toHaveAttribute("aria-selected", "true");
    expect(back).toBeVisible();
    expect(back).toHaveValue("Corrected back");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(frontTab);
    // Then: Verify the expected result in the assertions below.
    expect(front).toBeVisible();
    expect(front).toHaveValue("Corrected front");
  });

  it("reveals and focuses an invalid Back while preserving the valid Front", async () => {
    // Given: Prepare `user`, `onSubmit` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.clear(screen.getByRole("textbox", { name: "Back text" }));
    await user.click(screen.getByRole("tab", { name: "Front" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Back text is required.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Back" })).toHaveAttribute("aria-selected", "true");
    expect(onSubmit).not.toHaveBeenCalled();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const editor = screen.getByRole("dialog", { name: "Back text" });
    const expandedInput = within(editor).getByRole("textbox", { name: "Back text" });
    // Then: Verify the expected result in the assertions below.
    expect(expandedInput).toBeInvalid();
    expect(expandedInput).toHaveAccessibleDescription("Back text is required.");
    expect(within(editor).getByRole("alert")).toHaveTextContent("Back text is required.");
    expect(within(editor).getByRole("alert")).toBeVisible();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(within(editor).getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("tab", { name: "Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front");
  });
});

describe("SETTINGS-08 Card validation language changes", () => {
  it("translates unknown validation errors in place, including the expanded editor", async () => {
    // Given: Prepare `user`, `front` and any shared test state below.
    const user = userEvent.setup();
    render(<FormHarness errors={{ frontText: { type: "server", message: "Internal validation details" } }} />);
    const front = screen.getByRole("textbox", { name: "Front text" });
    expect(front).toHaveAccessibleDescription("The value is invalid.");
    expect(screen.getByRole("alert")).toHaveTextContent("The value is invalid.");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Expand Front" }));
    const expanded = within(screen.getByRole("dialog")).getByRole("textbox");
    // Then: Verify the expected result in the assertions below.
    expect(expanded).toHaveAccessibleDescription("The value is invalid.");

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(() => getI18n().changeLanguage("ja"));

    // Then: Verify the expected result in the assertions below.
    expect(front).toHaveAccessibleDescription("入力内容が正しくありません。");
    expect(within(screen.getByRole("dialog")).getByRole("textbox")).toBe(expanded);
    expect(expanded).toHaveAccessibleDescription("入力内容が正しくありません。");
    expect(within(screen.getByRole("dialog")).getByRole("alert")).toHaveTextContent("入力内容が正しくありません。");
    expect(screen.queryByText("Internal validation details")).not.toBeInTheDocument();
    expect(front).toHaveValue("Front");
    expect(expanded).toHaveValue("Front");
  });

  it("updates an existing error without losing the other draft or custom tags", async () => {
    // Given: Prepare `user`, `onSubmit` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.clear(screen.getByRole("textbox", { name: "Back text" }));
    await user.type(screen.getByRole("textbox", { name: "Back text" }), "未保存の回答");
    await user.click(screen.getByRole("tab", { name: "Front" }));
    const front = screen.getByRole("textbox", { name: "Front text" });
    await user.clear(front);
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(front).toHaveAccessibleDescription("Front text is required.");
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(() => getI18n().changeLanguage("ja"));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "表面のテキスト" })).toBe(front);
    expect(front).toHaveValue("");
    expect(front).toHaveAccessibleDescription("表面のテキストは必須です。");
    expect(screen.getByRole("button", { name: "タグを編集" })).toHaveAccessibleDescription("language, custom");
    expect(onSubmit).not.toHaveBeenCalled();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "表面を拡大" }));
    // Then: Verify the expected result in the assertions below.
    expect(within(screen.getByRole("dialog")).getByRole("textbox")).toHaveAccessibleDescription(
      "表面のテキストは必須です。"
    );
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");
    await user.type(front, "修正した問題");
    await user.click(screen.getByRole("tab", { name: "裏面" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "裏面のテキスト" })).toHaveValue("未保存の回答");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledWith({
      frontText: "修正した問題",
      backText: "未保存の回答",
      tags: ["language", "custom"],
    });
  });
});

describe("CARD-MANAGEMENT-15 CARD-MANAGEMENT-16 unsaved answer preview", () => {
  it("previews an incomplete draft without submitting, validating, or replacing the input", async () => {
    // Given: Prepare `user`, `onSubmit` and any shared test state below.
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} values={{ frontText: "", backText: "First\nSecond", tags: [] }} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Back" }));
    const input = screen.getByRole("textbox", { name: "Back text" });
    const status = screen.getByLabelText("Form status").textContent;
    const trigger = screen.getByRole("button", { name: "Preview answer" });
    await user.click(trigger);
    // Then: Verify the expected result in the assertions below.
    expect(
      within(screen.getByRole("region", { name: "Answer preview" })).getByText("First Second", { selector: "pre" })
    ).toHaveTextContent("First Second");
    expect(screen.getByLabelText("Form status").textContent).toBe(status);
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Enter}");
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("region", { name: "Answer preview" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Back text" })).toBe(input);
    expect(screen.getByLabelText("Form status").textContent).toBe(status);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders live math drafts and preserves validation, dirty state, and expanded input identity", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    render(<FormHarness deckCategory="math" errors={{ frontText: { type: "custom" } }} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByRole("textbox");
    await user.clear(input);
    await user.type(input, "**Draft**\n\n$x^2$\n\n| A | B |\n| - | - |\n| 1 | 2 |");
    const status = screen.getByLabelText("Form status").textContent;
    await user.click(within(dialog).getByRole("button", { name: "Preview answer" }));
    const preview = within(dialog).getByRole("region", { name: "Answer preview" });
    // Then: Verify the expected result in the assertions below.
    expect(within(preview).queryByRole("strong")).toHaveTextContent("Draft");
    expect(within(preview).getByRole("math", { hidden: true })).toBeDefined();
    expect(within(preview).getByRole("table")).toBeInTheDocument();
    expect(screen.getByLabelText("Form status").textContent).toBe(status);
    // When: Exercise `user.clear` with the prepared inputs.
    await user.clear(input);
    await user.type(input, "**Changed**");
    // Then: Verify the expected result in the assertions below.
    expect(within(preview).queryByRole("strong")).toHaveTextContent("Changed");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(within(dialog).getByRole("button", { name: "Hide preview" }));
    // Then: Verify the expected result in the assertions below.
    expect(within(dialog).getByRole("textbox")).toBe(input);
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("**Changed**");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription("Front text is required.");
  });

  it.each([
    { deckCategory: "python", tags: [], language: "python", dark: false },
    { deckCategory: "math", tags: ["custom", "typescript", "python"], language: "typescript", dark: true },
    { deckCategory: "math", tags: ["md"], language: "md", dark: false },
  ])("uses $language and dark=$dark from current rendering context", async ({ deckCategory, tags, language, dark }) => {
    // Given: Prepare `user`, `values` and any shared test state below.
    const user = userEvent.setup();
    const values = { frontText: "", backText: "const answer = 42;", tags };
    const { rerender } = render(<FormHarness values={values} deckCategory={deckCategory} dark={dark} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Preview answer" }));
    const preview = screen.getByRole("region", { name: "Answer preview" });
    // Then: Verify the expected result in the assertions below.
    expect(within(preview).getByRole("code")).toHaveAttribute("data-language", language);
    expect(within(preview).getByRole("code")).toHaveClass("hljs");
    expect(within(preview).getByRole("code")).toHaveAttribute("data-theme", dark ? "dark" : "light");
    expect(within(preview).queryByRole("math", { hidden: true })).toBeNull();
    // When: Exercise `rerender` with the prepared inputs.
    rerender(<FormHarness values={values} deckCategory={deckCategory} dark={!dark} />);
    // Then: Verify the expected result in the assertions below.
    expect(within(preview).getByRole("code")).toHaveAttribute("data-theme", dark ? "light" : "dark");
  });

  it("updates an open preview when tags change and falls back to the Deck category", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    render(<FormHarness deckCategory="math" values={{ frontText: "", backText: "**Draft**", tags: ["python"] }} />);
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Preview answer" }));
    const preview = screen.getByRole("region", { name: "Answer preview" });
    // Then: Verify the expected result in the assertions below.
    expect(within(preview).getByRole("code")).toHaveAttribute("data-language", "python");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("checkbox", { name: "python" }));
    await user.click(screen.getByRole("button", { name: "Close tag editor" }));
    // Then: Verify the expected result in the assertions below.
    expect(within(preview).queryByRole("strong")).toHaveTextContent("Draft");
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Edit tags" }));
    await user.click(screen.getByRole("checkbox", { name: "raw" }));
    await user.click(screen.getByRole("button", { name: "Close tag editor" }));
    // Then: Verify the expected result in the assertions below.
    expect(within(preview).queryByRole("strong")).toBeNull();
    expect(within(preview).getByText("**Draft**", { selector: "pre" })).toHaveTextContent("**Draft**");
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(() => getI18n().changeLanguage("ja"));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "プレビューを閉じる" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "解答プレビュー" })).toBeInTheDocument();
  });
});
