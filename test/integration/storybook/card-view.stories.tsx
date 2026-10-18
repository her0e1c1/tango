import type { StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { routeMeta, state, cards } from "./support";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  ...routeMeta,
  title: "Integration/Card view",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/card/${cards[0]!.id}` } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const BothSidesAndEdit: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-VIEW-01 Read both sides of the requested card", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByRole("region", { name: "Card answer" })).toHaveTextContent("Hola");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
      await expect(canvas.queryByText("Other prompt")).not.toBeInTheDocument();
      await expect(canvas.queryByText("Second")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Back" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Hola");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Front" }));
    });
    await step("STORYBOOK-CARD-VIEW-02 Edit the same card through its route", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("link", { name: "Edit card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Edit card" })).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Hello");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Hola");
    });
  },
};
export const Missing: Story = {
  parameters: { page: { ...state, path: "/card/missing" } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-VIEW-03 Explain an unavailable card and return home", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByRole("heading", { name: "Card not found" })).toBeVisible();
      await expect(canvas.queryByText("Hola")).not.toBeInTheDocument();
      await expect(canvas.queryByText("Other prompt")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Go home" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
    });
  },
};
