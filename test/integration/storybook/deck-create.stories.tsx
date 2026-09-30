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
      await userEvent.type(canvas.getByRole("textbox", { name: "Source URL" }), "https://example.com/deck.csv");
      await userEvent.click(canvas.getByRole("checkbox", { name: "Convert line breaks" }));
      await userEvent.click(canvas.getByText(/More settings/));
      await expect(canvas.getByRole("textbox", { name: "Source URL" })).not.toBeVisible();
      await userEvent.click(canvas.getByText(/More settings/));
      await expect(canvas.getByRole("textbox", { name: "Source URL" })).toHaveValue("https://example.com/deck.csv");
      await expect(canvas.getByRole("checkbox", { name: "Convert line breaks" })).toBeChecked();
    });
  },
};
export const InvalidUrl: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FORM-03 Reveal an invalid source URL on submit", async () => {
      await userEvent.type(await canvas.findByRole("textbox", { name: "Name" }), "New deck");
      await userEvent.click(canvas.getByText(/More settings/));
      await userEvent.type(canvas.getByRole("textbox", { name: "Source URL" }), "invalid");
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
      await expect(await canvas.findByText("Enter a valid URL.")).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Source URL" })).toHaveAttribute("aria-invalid", "true");
      await expect(canvas.queryByText(/Created deck/)).not.toBeInTheDocument();
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
