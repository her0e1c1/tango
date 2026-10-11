import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked } from "storybook/test";
import { createDeck } from "@/entities/deck";
import { routeMeta, state } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Deck create",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/deck/new" } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Inputs: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FORM-01 Enter a deck name and category", async () => {
      await userEvent.type(await canvas.findByRole("textbox", { name: "Name" }), "New deck");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("New deck");
      await expect(canvas.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
    });
    await step("STORYBOOK-DECK-FORM-02 Preserve hidden import formatting inputs", async () => {
      await userEvent.click(canvas.getByText(/More settings/));
      await userEvent.click(canvas.getByRole("checkbox", { name: "Convert line breaks" }));
      await userEvent.click(canvas.getByText(/More settings/));
      await expect(canvas.getByRole("checkbox", { name: "Convert line breaks", hidden: true })).not.toBeVisible();
      await userEvent.click(canvas.getByText(/More settings/));
      await expect(canvas.getByRole("checkbox", { name: "Convert line breaks" })).toBeChecked();
    });
  },
};
export const Success: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-CREATE-01 Show the newly created deck through routes", async () => {
      await userEvent.type(await canvas.findByRole("textbox", { name: "Name" }), "New deck");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "tango" }));
      await expect(await canvas.findByRole("button", { name: "Study New deck" })).toBeVisible();
    });
  },
};
export const Failure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-CREATE-02 Preserve failed creation inputs for retry", async () => {
      mocked(createDeck).mockRejectedValueOnce(new Error("Storage unavailable"));
      await userEvent.type(await canvas.findByRole("textbox", { name: "Name" }), "New deck");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent(/Unable to create/);
      await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("New deck");
      await expect(canvas.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
      await expect(canvas.getByRole("button", { name: "Create deck" })).toBeEnabled();
    });
  },
};

function requiredNameStory(japanese: boolean): Story {
  return {
    parameters: { locale: japanese ? "ja" : "en" },
    play: async ({ canvas, userEvent, step }) => {
      await step(
        "STORYBOOK-DECK-CREATE-03 Reject empty and whitespace-only names in the current language",
        async () => {
          const name = await canvas.findByRole("textbox", { name: japanese ? "デッキ名" : "Name" });
          const category = canvas.getByRole("combobox", { name: japanese ? "表示形式" : "Display format" });
          await userEvent.selectOptions(category, "math");
          for (const value of ["", "   "]) {
            await userEvent.clear(name);
            if (value) await userEvent.type(name, value);
            await userEvent.click(canvas.getByRole("button", { name: japanese ? "デッキを作成" : "Create deck" }));
            const message = japanese ? "デッキ名は必須です。" : "Deck name is required.";
            await expect(await canvas.findByText(message)).toBeVisible();
            await expect(name).toHaveAttribute("aria-invalid", "true");
            await expect(name).toHaveAccessibleDescription(message);
            await expect(name).toHaveValue(value);
            await expect(category).toHaveValue("math");
            await expect(mocked(createDeck)).not.toHaveBeenCalled();
          }
        }
      );
    },
  };
}
export const RequiredName = requiredNameStory(false);
export const JapaneseRequiredName = requiredNameStory(true);
export const RequiredNameLanguageChange: Story = {
  parameters: {
    page: { ...state, path: "/deck/new", preferences: { ...state.preferences, language: "system" } },
  },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-CREATE-04 Retranslate a visible name error without losing the draft", async () => {
      const name = await canvas.findByRole("textbox", { name: "Name" });
      await userEvent.clear(name);
      await userEvent.type(name, "   ");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
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
        await expect(mocked(createDeck)).not.toHaveBeenCalled();
      }
    });
  },
};
