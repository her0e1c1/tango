import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked } from "storybook/test";
import { createDeck } from "@/entities/deck";
import { routeMeta, state } from "./support";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  ...routeMeta,
  title: "Integration/Deck create",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/deck/new" } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Inputs: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FORM-01 Enter a deck name and category", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.type` with the prepared inputs.
      await userEvent.type(await canvas.findByRole("textbox", { name: "Name" }), "New deck");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("New deck");
      await expect(canvas.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
    });
    await step("STORYBOOK-DECK-FORM-02 Omit the unused line-break setting", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(
        canvas.queryByRole("checkbox", { name: "Convert line breaks", hidden: true })
      ).not.toBeInTheDocument();
      await expect(canvas.queryByText("More settings")).not.toBeInTheDocument();
      await expect(
        canvas.queryByText("Combine two consecutive line breaks into one displayed line break.")
      ).not.toBeInTheDocument();
    });
  },
};
export const Success: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-CREATE-01 Show the newly created deck through routes", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.type` with the prepared inputs.
      await userEvent.type(await canvas.findByRole("textbox", { name: "Name" }), "New deck");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "tango" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "Study New deck" })).toBeVisible();
    });
  },
};
export const Failure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-CREATE-02 Preserve failed creation inputs for retry", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(createDeck).mockRejectedValueOnce(new Error("Storage unavailable"));
      // When: Exercise `userEvent.type` with the prepared inputs.
      await userEvent.type(await canvas.findByRole("textbox", { name: "Name" }), "New deck");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("alert")).toHaveTextContent(/Unable to create/);
      await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("New deck");
      await expect(canvas.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
      await expect(canvas.getByRole("button", { name: "Create deck" })).toBeEnabled();
    });
  },
};

function requiredNameStory(japanese: boolean): Story {
  const nameLabel = japanese ? "デッキ名" : "Name";
  const categoryLabel = japanese ? "表示形式" : "Display format";
  const submitLabel = japanese ? "デッキを作成" : "Create deck";
  const message = japanese ? "デッキ名は必須です。" : "Deck name is required.";

  return {
    parameters: { locale: japanese ? "ja" : "en" },
    play: async ({ canvas, userEvent, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step(
        "STORYBOOK-DECK-CREATE-03 Reject empty and whitespace-only names in the current language",
        async () => {
          // Given: Use the rendered story, its args, parameters, and any setup below.
          const name = await canvas.findByRole("textbox", { name: nameLabel });
          const category = canvas.getByRole("combobox", { name: categoryLabel });
          // When: Exercise `userEvent.selectOptions` with the prepared inputs.
          await userEvent.selectOptions(category, "math");
          for (const value of ["", "   "]) {
            // Given: Use the current iteration or branch inputs from the enclosing case.
            // When: Exercise `userEvent.clear` with the prepared inputs.
            await userEvent.clear(name);
            if (value) await userEvent.type(name, value);
            await userEvent.click(canvas.getByRole("button", { name: submitLabel }));
            // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-CREATE-04 Retranslate a visible name error without losing the draft", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const name = await canvas.findByRole("textbox", { name: "Name" });
      // When: Exercise `userEvent.clear` with the prepared inputs.
      await userEvent.clear(name);
      await userEvent.type(name, "   ");
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Display format" }), "math");
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByText("Deck name is required.")).toBeVisible();
      // When: Exercise `name.getAttribute` with the prepared inputs.
      const descriptionId = name.getAttribute("aria-describedby");
      await userEvent.click(name);
      for (const [language, label, message] of [
        ["ja-JP", "デッキ名", "デッキ名は必須です。"],
        ["en-US", "Name", "Deck name is required."],
      ] as const) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Apply the operation or event under test.
        Object.defineProperty(navigator, "language", { configurable: true, value: language });
        window.dispatchEvent(new Event("languagechange"));
        // Then: Verify the expected result in the assertions below.
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
