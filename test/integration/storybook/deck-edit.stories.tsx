import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked, screen, within } from "storybook/test";
import { deleteDeck, editDeck } from "@/entities/deck";
import { routeMeta, state, deck, cards } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Deck edit",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/deck/${deck.id}/edit` } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const SavedValues: Story = {
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-EDIT-01 Read only the selected deck's saved values", async () => {
      await expect(await canvas.findByRole("textbox", { name: "Name" })).toHaveValue("Japanese verbs");
      await expect(canvas.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
      await expect(canvas.queryByDisplayValue("Other deck")).not.toBeInTheDocument();
    });
  },
};
export const Save: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-EDIT-02 Reflect the saved name in the deck list", async () => {
      const name = await canvas.findByRole("textbox", { name: "Name" });
      await userEvent.clear(name);
      await userEvent.type(name, "Renamed deck");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study Renamed deck" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study Other deck" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Study Japanese verbs" })).not.toBeInTheDocument();
    });
  },
};
export const Failure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-EDIT-03 Keep the failed edit available for retry", async () => {
      mocked(editDeck).mockRejectedValueOnce(new Error("Storage unavailable"));
      const name = await canvas.findByRole("textbox", { name: "Name" });
      await userEvent.clear(name);
      await userEvent.type(name, "Renamed deck");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to save changes. Try again.");
      await expect(name).toHaveValue("Renamed deck");
      await expect(canvas.getByRole("button", { name: "Save changes" })).toBeEnabled();
    });
  },
};
export const Delete: Story = {
  parameters: {
    page: {
      ...state,
      path: `/deck/${deck.id}/edit`,
      cards: Array.from({ length: 24 }, (_, index) => ({
        ...cards[0]!,
        id: `delete-card-${index}`,
        uniqueKey: `delete-key-${index}`,
      })),
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FORM-04 Confirm deletion and retain the other deck", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Delete deck" }));
      const dialog = within(await screen.findByRole("alertdialog", { name: "Delete deck?" }));
      await expect(dialog.getByText("Japanese verbs", { exact: true })).toBeVisible();
      await expect(dialog.getByText("This permanently deletes 24 cards in this deck.")).toBeVisible();
      await userEvent.click(dialog.getByRole("button", { name: "Delete deck" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Study Japanese verbs" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Study Other deck" })).toBeVisible();
    });
  },
};
function cancelStory(escape: boolean): Story {
  return {
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-DECK-FORM-05 Cancel deletion and preserve the editor", async () => {
        await userEvent.click(await canvas.findByRole("button", { name: "Delete deck" }));
        if (escape) await userEvent.keyboard("{Escape}");
        else
          await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
        await expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
        await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("Japanese verbs");
        await expect(canvas.queryByText(/Deleted deck/)).not.toBeInTheDocument();
      });
    },
  };
}
export const Cancel = cancelStory(false);
export const Escape = cancelStory(true);
export const PendingDeletion: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FORM-06 Keep deletion confirmation locked while pending", async () => {
      const pending = Promise.withResolvers<void>();
      mocked(deleteDeck).mockImplementationOnce(() => pending.promise);
      try {
        await userEvent.click(await canvas.findByRole("button", { name: "Delete deck" }));
        const dialog = within(await screen.findByRole("alertdialog"));
        await userEvent.click(dialog.getByRole("button", { name: "Delete deck" }));
        await expect(dialog.getByRole("button", { name: "Delete deck" })).toBeDisabled();
        await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
        await userEvent.keyboard("{Escape}");
        await expect(screen.getByRole("alertdialog")).toBeVisible();
      } finally {
        pending.resolve();
      }
    });
  },
};

function requiredNameStory(japanese: boolean): Story {
  return {
    parameters: { locale: japanese ? "ja" : "en" },
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-DECK-EDIT-04 Reject empty and whitespace-only names in the current language", async () => {
        const name = await canvas.findByRole("textbox", { name: japanese ? "デッキ名" : "Name" });
        const category = canvas.getByRole("combobox", { name: japanese ? "表示形式" : "Display format" });
        await userEvent.selectOptions(category, "math");
        for (const value of ["", "   "]) {
          await userEvent.clear(name);
          if (value) await userEvent.type(name, value);
          await userEvent.click(canvas.getByRole("button", { name: japanese ? "変更を保存" : "Save changes" }));
          const message = japanese ? "デッキ名は必須です。" : "Deck name is required.";
          await expect(await canvas.findByText(message)).toBeVisible();
          await expect(name).toHaveAttribute("aria-invalid", "true");
          await expect(name).toHaveAccessibleDescription(message);
          await expect(name).toHaveValue(value);
          await expect(category).toHaveValue("math");
          await expect(mocked(editDeck)).not.toHaveBeenCalled();
        }
      });
    },
  };
}
export const RequiredName = requiredNameStory(false);
export const JapaneseRequiredName = requiredNameStory(true);
export const RequiredNameLanguageChange: Story = {
  parameters: {
    page: { ...state, path: `/deck/${deck.id}/edit`, preferences: { ...state.preferences, language: "system" } },
  },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-EDIT-05 Retranslate a visible name error without losing the draft", async () => {
      const name = await canvas.findByRole("textbox", { name: "Name" });
      await userEvent.clear(name);
      await userEvent.type(name, "   ");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByText("Deck name is required.")).toBeVisible();
      const descriptionId = name.getAttribute("aria-describedby");
      await userEvent.click(name);
      for (const [language, label, message] of [
        ["ja-JP", "デッキ名", "デッキ名は必須です。"],
        ["en-US", "Name", "Deck name is required."],
      ] as const) {
        Object.defineProperty(navigator, "language", { configurable: true, value: language });
        window.dispatchEvent(new Event("languagechange"));
        await expect(await canvas.findByText(message)).toBeVisible();
        await expect(canvas.getByRole("textbox", { name: label })).toBe(name);
        await expect(name).toHaveValue("   ");
        await expect(name).toHaveFocus();
        await expect(name).toHaveAttribute("aria-describedby", descriptionId!);
        await expect(name).toHaveAccessibleDescription(message);
        await expect(canvas.getByRole("combobox")).toHaveValue("math");
        await expect(mocked(editDeck)).not.toHaveBeenCalled();
      }
    });
  },
};
