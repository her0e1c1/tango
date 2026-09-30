import type { StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { routeMeta, state } from "./support";
const meta = {
  ...routeMeta,
  title: "Integration/Not found",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/unknown-page" } },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Recovery: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-NOT-FOUND-01 Explain an unknown route", async () => {
      await expect(await canvas.findByRole("heading", { name: "Page not found" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Go home" })).toBeEnabled();
    });
    await step("STORYBOOK-NOT-FOUND-02 Return home and use the deck list", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Go home" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study Japanese verbs" })).toBeEnabled();
    });
  },
};
