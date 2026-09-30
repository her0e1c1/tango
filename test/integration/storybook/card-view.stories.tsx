import type { StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { routeMeta, state, cards } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Card view",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/card/${cards[0]!.id}` } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const BothSidesAndEdit: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-VIEW-01 Read both sides of the requested card", async () => {
      await expect(await canvas.findByRole("region", { name: "Card answer" })).toHaveTextContent("Hola");
      await userEvent.click(canvas.getByRole("button", { name: "Front" }));
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
      await expect(canvas.queryByText("Other prompt")).not.toBeInTheDocument();
      await expect(canvas.queryByText("Second")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Back" }));
      await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Hola");
      await userEvent.click(canvas.getByRole("button", { name: "Front" }));
    });
    await step("STORYBOOK-CARD-VIEW-02 Edit the same card through its route", async () => {
      await userEvent.click(canvas.getByRole("link", { name: "Edit card" }));
      await expect(await canvas.findByRole("heading", { name: "Edit card" })).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Hello");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Hola");
    });
  },
};
export const Missing: Story = {
  parameters: { page: { ...state, path: "/card/missing" } },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-VIEW-03 Explain an unavailable card and return home", async () => {
      await expect(await canvas.findByRole("heading", { name: "Card not found" })).toBeVisible();
      await expect(canvas.queryByText("Hola")).not.toBeInTheDocument();
      await expect(canvas.queryByText("Other prompt")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Go home" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
    });
  },
};
