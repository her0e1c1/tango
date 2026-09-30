import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked } from "storybook/test";
import { startStudy } from "@/entities/study-session";
import { routeMeta, state, deck, cards } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Study session start",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/deck/${deck.id}/start` } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-SESSION-START-01 Start the selected deck", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Start 5 cards" }));
      await expect(await canvas.findByRole("button", { name: "Hello" })).toBeVisible();
      await expect(canvas.getByRole("slider", { name: "Study progress" })).toHaveAttribute("aria-valuetext", "1 of 5");
      await expect(canvas.queryByText("Other prompt")).not.toBeInTheDocument();
    });
  },
};
export const NoMatches: Story = {
  parameters: {
    page: {
      ...state,
      decks: [{ ...deck, studyFilter: { selectedTags: ["missing"], tagAndFilter: false } }],
      path: `/deck/${deck.id}/start`,
    },
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-STUDY-SESSION-START-02 Explain unmatched filters", async () => {
      await expect(await canvas.findByText("No cards match your filters.")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
      await expect(canvas.queryByRole("slider", { name: "Study progress" })).not.toBeInTheDocument();
    });
  },
};
export const Retry: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-SESSION-START-03 Recover from a start failure", async () => {
      mocked(startStudy).mockRejectedValueOnce(new Error("Unavailable"));
      await userEvent.click(await canvas.findByRole("button", { name: "Start 5 cards" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent(/Unable to save/);
      await expect(canvas.getByRole("button", { name: "Start 5 cards" })).toBeEnabled();
      await expect(canvas.queryByRole("slider")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Start 5 cards" }));
      await expect(await canvas.findByRole("button", { name: cards[0]!.frontText })).toBeVisible();
    });
  },
};
