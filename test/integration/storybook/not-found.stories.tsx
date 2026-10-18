import type { StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { routeMeta, state } from "./support";
// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  ...routeMeta,
  title: "Integration/Not found",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/unknown-page" } },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Recovery: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-NOT-FOUND-01 Explain an unknown route", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Evaluate `canvas.findByRole` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Page not found" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Go home" })).toBeEnabled();
    });
    await step("STORYBOOK-NOT-FOUND-02 Return home and use the deck list", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Go home" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study Japanese verbs" })).toBeEnabled();
    });
  },
};
