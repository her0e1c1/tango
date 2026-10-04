import type { StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, mocked, waitFor, within } from "storybook/test";
import { appI18n } from "@/app/i18n/instance";
import { I18nProvider } from "@/app/i18n";
import { BackText, editCard, useCard, type Card } from "@/entities/card";
import { CardEditor } from "@/pages/card-edit/ui/CardEditor";
import { useCardEditPageModel } from "@/pages/card-edit/model/useCardEditPageModel";
import { AppLayout } from "@/widgets/app-layout";
import { ToastViewport } from "@/shared/ui/toast";
import { replaceRemoteCards } from "@/test/utils/entityFixtures";
import { routeMeta, state, deck, cards } from "./support";

const card = { ...cards[0]!, frontText: "Front", backText: "Back", tags: ["language", "custom"] };
function pageFor(value: Partial<Card> = {}, category = "math") {
  return {
    ...state,
    decks: [{ ...deck, category }],
    cards: [{ ...card, ...value }, { ...cards[1]!, tags: ["raw", "math"] }, ...cards.slice(2)],
    path: `/card/${card.id}/edit`,
  };
}
const meta = { ...routeMeta, title: "Integration/Card edit", parameters: { ...routeMeta.parameters, page: pageFor() } };
export default meta;
type Story = StoryObj<typeof meta>;

export const TabsAndTags: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-01 Retain the prompt across tab changes", async () => {
      const input = await canvas.findByRole("textbox", { name: "Front text" });
      await userEvent.clear(input);
      await userEvent.type(input, "Updated prompt");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated prompt");
    });
    await step("STORYBOOK-CARD-FORM-02 Select the raw tag and update its summary", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "raw" }));
      await expect(canvas.getByRole("checkbox", { name: "raw" })).toBeChecked();
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("button", { name: "Edit tags" })).toHaveAccessibleDescription(
        "language, custom, raw"
      );
    });
    await step("STORYBOOK-CARD-FORM-08 Switch tab selection and focus by keyboard", async () => {
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
export const ExpandedDraft: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-06 Preserve both sides after expanded editing", async () => {
      const front = await canvas.findByRole("textbox", { name: "Front text" });
      await userEvent.clear(front);
      await userEvent.type(front, "Updated front");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      const back = within(canvas.getByRole("dialog")).getByRole("textbox", { name: "Back text" });
      await userEvent.clear(back);
      await userEvent.type(back, "Updated back");
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("button", { name: "Expand Back" })).toHaveFocus();
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(front).toHaveValue("Updated front");
    });
  },
};
export const CustomTags: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-07 Preserve custom tags through reopening and save", async () => {
      const trigger = await canvas.findByRole("button", { name: "Edit tags" });
      await userEvent.click(trigger);
      await userEvent.click(canvas.getByRole("checkbox", { name: "custom" }));
      await expect(canvas.getByRole("checkbox", { name: "custom" })).not.toBeChecked();
      await userEvent.click(canvas.getByRole("checkbox", { name: "custom" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "math" }));
      await userEvent.keyboard("{Escape}");
      await userEvent.click(trigger);
      for (const name of ["language", "custom", "math"])
        await expect(canvas.getByRole("checkbox", { name })).toBeChecked();
      await userEvent.keyboard("{Escape}");
      await expect(trigger).toHaveAccessibleDescription("language, custom, math");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      const row = canvas.getByRole("button", { name: "View Front" }).closest("article")!;
      for (const name of ["language", "custom", "math"])
        await expect(within(row).getByText(name, { exact: true })).toBeVisible();
    });
  },
};
export const BackError: Story = {
  parameters: { page: pageFor({ backText: "" }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-09 Reveal and describe invalid back inputs", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Save changes" }));
      const back = canvas.getByRole("textbox", { name: "Back text" });
      await waitFor(() => expect(back).toHaveFocus());
      await expect(back).toHaveAccessibleDescription("Back text is required.");
      await expect(canvas.getByRole("tab", { name: "Back" })).toHaveAttribute("aria-selected", "true");
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      await expect(
        within(canvas.getByRole("dialog")).getByRole("textbox", { name: "Back text" })
      ).toHaveAccessibleDescription("Back text is required.");
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Front");
    });
  },
};
export const BothErrors: Story = {
  parameters: { page: pageFor({ frontText: "", backText: "" }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-22 Focus the invalid front before showing the back error", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Save changes" }));
      await waitFor(() => expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveFocus());
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription(
        "Front text is required."
      );
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
        "Back text is required."
      );
    });
  },
};
export const JapaneseError: Story = {
  parameters: { locale: "ja", page: pageFor({ frontText: "" }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-03 Associate the Japanese required error", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "変更を保存" }));
      await expect(canvas.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        "表面のテキストは必須です。"
      );
      await expect(canvas.getByRole("alert")).toHaveTextContent("表面のテキストは必須です。");
    });
  },
};
export const LocalizedDraft: Story = {
  parameters: { page: pageFor({ frontText: "", backText: "未保存の回答" }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-11 Keep draft values while translating and correcting an error", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Save changes" }));
      await appI18n.changeLanguage("ja");
      await expect(canvas.getByRole("heading", { name: "カードを編集" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "タグを編集" })).toHaveAccessibleDescription("language, custom");
      await userEvent.type(canvas.getByRole("textbox", { name: "表面のテキスト" }), "修正した問題");
      await userEvent.click(canvas.getByRole("tab", { name: "裏面" }));
      await expect(canvas.getByRole("textbox", { name: "裏面のテキスト" })).toHaveValue("未保存の回答");
      await userEvent.click(canvas.getByRole("button", { name: "変更を保存" }));
      await expect(await canvas.findByRole("button", { name: "修正した問題を表示" })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "修正した問題を表示" }));
      await expect(await canvas.findByText("未保存の回答")).toBeVisible();
    });
  },
};
export const SavePending: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-20 Disable editing and departure during a pending save", async () => {
      const original = mocked(editCard).getMockImplementation()!;
      let finish!: () => void;
      mocked(editCard).mockImplementationOnce(async (...args) => {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        await original(...args);
      });
      const input = await canvas.findByRole("textbox", { name: "Front text" });
      await userEvent.type(input, " changed");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      for (const name of ["Saving…", "Cancel", "Back to cards"])
        await expect(canvas.getByRole("button", { name })).toBeDisabled();
      await expect(input).toBeDisabled();
      finish();
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "View Front changed" })).toBeEnabled();
    });
  },
};
export const ExternalUpdate: Story = {
  parameters: { page: pageFor({ frontText: "Front text", backText: "Back text" }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-21 Keep the opening snapshot after subscription updates", async () => {
      const input = await canvas.findByRole("textbox", { name: "Front text" });
      await userEvent.clear(input);
      await userEvent.type(input, "Unsaved front");
      replaceRemoteCards([{ ...card, frontText: "Remote front", backText: "Remote back" }]);
      await expect(input).toHaveValue("Unsaved front");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Back text");
    });
  },
};
export const Retry: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-23 Retry the failed edit with the same draft", async () => {
      mocked(editCard).mockRejectedValueOnce(new Error("Unavailable"));
      const input = await canvas.findByRole("textbox", { name: "Front text" });
      await userEvent.clear(input);
      await userEvent.type(input, "Retry front");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to save changes. Try again.");
      await expect(input).toHaveValue("Retry front");
      await expect(input).toBeEnabled();
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("button", { name: "View Retry front" })).toBeVisible();
    });
  },
};
export const DirectTags: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-24 Update tag drafts without a confirmation step", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Edit tags" }));
      const name = canvas.getByRole("textbox", { name: "Tag name 1" });
      await userEvent.clear(name);
      await userEvent.type(name, "renamed");
      await expect(name).toHaveFocus();
      await userEvent.click(canvas.getByRole("button", { name: "Remove tag 2" }));
      await userEvent.click(canvas.getByRole("button", { name: "Add tag" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Tag name 2" }), "new");
      await expect(canvas.queryByRole("button", { name: /^(Done|OK|Confirm)$/ })).not.toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("button", { name: "Edit tags" })).toHaveAccessibleDescription("renamed, new");
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await expect(canvas.getByRole("textbox", { name: "Tag name 1" })).toHaveValue("renamed");
      await expect(canvas.getByRole("textbox", { name: "Tag name 2" })).toHaveValue("new");
      await expect(canvas.getByRole("status", { name: "Toast notifications" })).toBeEmptyDOMElement();
    });
  },
};
export const InvalidTags: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-25 Reject blank and duplicate tags before accepting a correction", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("button", { name: "Add tag" }));
      for (const [value, message] of [
        [" ", "Tag name is required."],
        ["custom", "Tag names must be unique."],
        [" custom ", "Tag names must be unique."],
      ] as const) {
        const input = canvas.getByRole("textbox", { name: "Tag name 3" });
        await userEvent.clear(input);
        await userEvent.type(input, value);
        await userEvent.tab();
        await expect(input).toHaveAccessibleDescription(message);
        await userEvent.keyboard("{Escape}");
        await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
        await expect(canvas.getByRole("heading", { name: "Edit card" })).toBeVisible();
        await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      }
      const input = canvas.getByRole("textbox", { name: "Tag name 3" });
      await userEvent.clear(input);
      await userEvent.type(input, " new tag ");
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      await expect(
        within(canvas.getByRole("button", { name: "View Front" }).closest("article")!).getByText("new tag", {
          exact: true,
        })
      ).toBeVisible();
    });
  },
};

// RHF's public API prepares an error the application schema cannot produce; the real Page model, actions and editor remain composed.
function UnknownErrorPage() {
  const card = useCard(cards[0]!.id)!;
  const model = useCardEditPageModel(card);
  useEffect(() => {
    model.form.setError("frontText", { type: "unknown", message: "private diagnostic" });
  }, [model.form]);
  return (
    <AppLayout showHeader>
      {model.navigationGuard}
      <CardEditor {...model} preview={<BackText {...model.preview} />} />
    </AppLayout>
  );
}
export const UnknownError: Story = {
  render: () => <UnknownErrorRoute />,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-10 Translate an unknown error without exposing its internal message", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Expand Front" }));
      await appI18n.changeLanguage("ja");
      const dialog = within(canvas.getByRole("dialog"));
      await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveValue("Front");
      await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        "入力内容が正しくありません。"
      );
      await expect(canvas.queryByText("private diagnostic")).not.toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        "入力内容が正しくありません。"
      );
    });
  },
};

function UnknownErrorRoute() {
  const [router] = useState(() =>
    createMemoryRouter([
      {
        path: "/",
        element: (
          <I18nProvider>
            <UnknownErrorPage />
            <ToastViewport />
          </I18nProvider>
        ),
      },
    ])
  );
  useEffect(() => () => router.dispose(), [router]);
  return <RouterProvider router={router} />;
}

const mathDraft = "**Draft**\n\n$x^2$\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";
export const Preview: Story = {
  parameters: { page: pageFor({ backText: mathDraft, tags: [] }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-04 Render the draft as bold text and math", async () => {
      await userEvent.click(await canvas.findByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      await expect(within(preview).getByText("Draft").tagName).toBe("STRONG");
      await expect(preview.querySelector(".katex")).toBeVisible();
    });
    await step("STORYBOOK-CARD-FORM-16 Keep the preview open when its language changes", async () => {
      await appI18n.changeLanguage("ja");
      await expect(canvas.getByRole("region", { name: "解答プレビュー" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "プレビューを閉じる" })).toHaveAttribute("aria-expanded", "true");
    });
  },
};
export const MobilePreview: Story = { ...Preview, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const IncompletePreview: Story = {
  parameters: { page: pageFor({ frontText: "", backText: "First\nSecond", tags: ["raw"] }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-12 Preview an incomplete draft without saving or validating", async () => {
      await userEvent.click(await canvas.findByRole("tab", { name: "Back" }));
      const trigger = canvas.getByRole("button", { name: "Preview answer" });
      await userEvent.click(trigger);
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      await expect(preview).toHaveTextContent("First Second");
      await expect(preview.querySelector("pre")).toHaveTextContent("First Second");
      await userEvent.keyboard("{Enter}");
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("First\nSecond");
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("");
      await expect(canvas.getByRole("heading", { name: "Edit card" })).toBeVisible();
    });
  },
};
export const ExpandedMath: Story = {
  parameters: { page: pageFor({ frontText: "", tags: [] }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-13 Update the expanded math preview while retaining a front error", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Save changes" }));
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
      const dialog = within(canvas.getByRole("dialog"));
      const input = dialog.getByRole("textbox", { name: "Back text" });
      await userEvent.clear(input);
      await userEvent.type(input, mathDraft);
      await userEvent.click(dialog.getByRole("button", { name: "Preview answer" }));
      const preview = dialog.getByRole("region", { name: "Answer preview" });
      await expect(within(preview).getByText("Draft").tagName).toBe("STRONG");
      await expect(preview.querySelector(".katex")).toBeVisible();
      await expect(within(preview).getByRole("table")).toBeVisible();
      await userEvent.clear(input);
      await userEvent.type(input, mathDraft.replace("Draft", "Changed"));
      await expect(within(preview).getByText("Changed")).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue(
        mathDraft.replace("Draft", "Changed")
      );
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription(
        "Front text is required."
      );
    });
  },
};
function codeStory(category: string, tags: string[], language: string): Story {
  return {
    parameters: { page: pageFor({ backText: "const answer = 42;", tags }, category) },
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-CARD-FORM-14 Choose the code language and update the open preview theme", async () => {
        await userEvent.click(await canvas.findByRole("tab", { name: "Back" }));
        await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
        const preview = canvas.getByRole("region", { name: "Answer preview" });
        const code = preview.querySelector("code");
        await expect(code).toHaveAttribute("data-language", language);
        await expect(code).toHaveTextContent("const answer = 42;");
        await expect(code).toHaveAttribute("data-theme", "light");
        await expect(preview.querySelector(".katex")).toBeNull();
        await userEvent.click(canvas.getByRole("button", { name: "Switch to dark mode" }));
        await expect(code).toHaveAttribute("data-theme", "dark");
      });
    },
  };
}
export const DeckPython = codeStory("python", [], "python");
export const TaggedTypescript = codeStory("math", ["custom", "typescript", "python"], "typescript");
export const TaggedMarkdown = codeStory("math", ["md"], "md");
export const PreviewTags: Story = {
  parameters: { page: pageFor({ backText: "**Draft**", tags: ["python"] }) },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-15 Update an open preview after changing format tags", async () => {
      await userEvent.click(await canvas.findByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      await expect(preview.querySelector("code")).toHaveAttribute("data-language", "python");
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "python" }));
      await userEvent.keyboard("{Escape}");
      await expect(within(preview).getByText("Draft").tagName).toBe("STRONG");
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("checkbox", { name: "raw" }));
      await userEvent.keyboard("{Escape}");
      await expect(preview).toHaveTextContent("**Draft**");
      await expect(preview.querySelector("strong")).toBeNull();
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("**Draft**");
    });
  },
};
export const LongPreview: Story = {
  parameters: {
    page: pageFor({
      backText: Array.from(
        { length: 150 },
        (_, i) => `Paragraph ${i + 1}: a long answer with meaningful content.`
      ).join("\n\n"),
      tags: ["raw"],
    }),
  },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-EDIT-01 Reach an overflowing preview before other controls", async () => {
      await userEvent.click(await canvas.findByRole("tab", { name: "Back" }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      await userEvent.tab();
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      await expect(preview).toHaveFocus();
      await expect(preview.scrollHeight).toBeGreaterThan(preview.clientHeight);
    });
    await userEvent.click(canvas.getByRole("button", { name: "Hide preview" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
    await step("STORYBOOK-CARD-EDIT-02 Cycle focus inside expanded editing with a hidden preview", async () => {
      const dialog = within(canvas.getByRole("dialog"));
      const trigger = dialog.getByRole("button", { name: "Preview answer" });
      trigger.focus();
      await userEvent.tab();
      await expect(dialog.getByRole("button", { name: "Done" })).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(trigger).toHaveFocus();
    });
  },
};
