import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked } from "storybook/test";
import { startStudy } from "@/entities/study-session";
import { routeMeta, state, deck, cards } from "./support";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  ...routeMeta,
  title: "Integration/Study session start",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/deck/${deck.id}/start` } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-SESSION-START-01 Start the selected deck", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Start 5 cards" }));
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-SESSION-START-02 Explain unmatched filters", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByText("No cards match your filters.")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
      await expect(canvas.queryByRole("slider", { name: "Study progress" })).not.toBeInTheDocument();
    });
  },
};
export const Retry: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-SESSION-START-03 Recover from a start failure", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(startStudy).mockRejectedValueOnce(new Error("Unavailable"));
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Start 5 cards" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("alert")).toHaveTextContent(/Unable to save/);
      await expect(canvas.getByRole("button", { name: "Start 5 cards" })).toBeEnabled();
      await expect(canvas.queryByRole("slider")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Start 5 cards" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: cards[0]!.frontText })).toBeVisible();
    });
  },
};
