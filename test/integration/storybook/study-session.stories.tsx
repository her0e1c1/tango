import type { StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, mocked, waitFor } from "storybook/test";
import { getI18n } from "react-i18next";
import { updatePreferences } from "@/entities/preference";
import { writeStudyAnswer } from "@/entities/study-answer";
import { showToast } from "@/shared/ui/toast";
import { dismissToast } from "@/shared/ui/toast/model";
import { routeMeta, state, deck, cards, session } from "./support";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  ...routeMeta,
  title: "Integration/Study session",
  parameters: {
    ...routeMeta.parameters,
    page: { ...state, sessionsByDeckId: session(), path: `/deck/${deck.id}/study` },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
const manyCards = Array.from({ length: 24 }, (_, index) => ({
  ...cards[0]!,
  id: `study-${index}`,
  frontText: `Prompt ${index + 1}`,
}));

export const Playback: Story = {
  parameters: {
    page: { ...state, cards: manyCards, sessionsByDeckId: session(3, manyCards), path: `/deck/${deck.id}/study` },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-01 Play the fourth card of 24", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByText("4 / 24")).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Play" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true");
    });
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("button", { name: "Pause" }));
    await step("STORYBOOK-STUDY-CONTROLS-03 Activate Play with Enter", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("button", { name: "Play" }).focus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Enter}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true");
    });
  },
};
export const Skip: Story = {
  parameters: {
    page: {
      ...state,
      preferences: { ...state.preferences, controls: { ...state.preferences.controls, showSkip: true } },
      sessionsByDeckId: session(),
      path: `/deck/${deck.id}/study`,
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-02 Skip without a recall grade", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Skip" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "Second" })).toBeVisible();
      await expect(canvas.getByRole("slider")).toHaveAttribute("aria-valuetext", "2 of 5");
      await expect(canvas.queryByText(/FSRS D:/)).not.toBeInTheDocument();
    });
  },
};
export const Position: Story = {
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-04 Keep the slider, progress and card aligned", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const slider = await canvas.findByRole("slider", { name: "Study progress" });
      // When: Exercise `fireEvent.change` with the prepared inputs.
      await fireEvent.change(slider, { target: { value: "2" } });
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "Third" })).toBeVisible();
      await expect(slider).toHaveValue("2");
      await expect(slider).toHaveAttribute("aria-valuetext", "3 of 5");
      await expect(canvas.getByText("3 / 5")).toBeVisible();
    });
  },
};
export const DisabledDirection: Story = {
  parameters: {
    page: {
      ...state,
      preferences: { ...state.preferences, controls: { ...state.preferences.controls, cardSwipeLeft: "DoNothing" } },
      sessionsByDeckId: session(),
      path: `/deck/${deck.id}/study`,
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-05 Skip unavailable directions during Tab navigation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const left = await canvas.findByRole("button", { name: "Swipe left: No action" });
      await expect(left).toBeDisabled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(left);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Hello" })).toBeVisible();
      // When: Exercise `canvas.getByRole("button", { name: "Hello" }).focus` with the prepared inputs.
      canvas.getByRole("button", { name: "Hello" }).focus();
      await userEvent.tab();
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Swipe up: Easy" })).toHaveFocus();
    });
  },
};
export const DirectionKeyboard: Story = {
  parameters: {
    page: {
      ...state,
      preferences: { ...state.preferences, controls: { ...state.preferences.controls, cardSwipeLeft: "GoToNextCard" } },
      sessionsByDeckId: session(),
      path: `/deck/${deck.id}/study`,
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-06 Run one direction action with Enter", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const left = await canvas.findByRole("button", { name: "Swipe left: Skip" });
      await expect(left).toHaveAttribute("aria-description", "Skip");
      left.focus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Enter}");
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "Second" })).toBeVisible();
      await expect(canvas.getByRole("slider")).toHaveValue("1");
    });
  },
};
export const Help: Story = {
  parameters: {
    page: {
      ...state,
      preferences: { ...state.preferences, controls: { ...state.preferences.controls, cardSwipeUp: "RateGood" } },
      sessionsByDeckId: session(),
      path: `/deck/${deck.id}/study`,
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const trigger = await canvas.findByRole("button", { name: "Open study help" });
    await step("STORYBOOK-STUDY-CONTROLS-07 Open named and described modal help", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(trigger);
      const dialog = canvas.getByRole("dialog", { name: "Study controls" });
      // Then: Verify the expected result in the assertions below.
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(dialog).toHaveAccessibleDescription(/Review the controls/);
      await expect(canvas.getByText("Arrow Up / Swipe Up")).toBeVisible();
      await expect(canvas.getAllByText("Good — answer and continue")[0]).toBeVisible();
      await expect(canvas.getByText("Flip or reveal the current card")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus();
    });
    await step("STORYBOOK-STUDY-CONTROLS-08 Trap focus and restore the help trigger", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.tab` with the prepared inputs.
      await userEvent.tab();
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus();
      // When: Exercise `userEvent.tab` with the prepared inputs.
      await userEvent.tab({ shift: true });
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
      await expect(trigger).toHaveFocus();
    });
  },
};
export const HelpWithNotifications: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step(
      "STORYBOOK-STUDY-CONTROLS-09 Keep disappearing background notifications outside the modal focus",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        showToast({ messageKey: "toast.saveFailure", tone: "warning" });
        await expect(await canvas.findByRole("button", { name: "Dismiss notification" })).toBeVisible();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Open study help" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
        // When: Exercise `dismissToast` with the prepared inputs.
        dismissToast();
        // Then: Verify the expected result in the assertions below.
        await waitFor(() => expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus());
      }
    );
    await step("STORYBOOK-STUDY-CONTROLS-10 Restore notification controls after closing help", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      showToast({ messageKey: "toast.saveFailure", tone: "warning" });
      await expect(canvas.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close help" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "Dismiss notification" })).toBeEnabled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Dismiss notification" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    });
  },
};
export const Answer: Story = {
  parameters: {
    page: {
      ...state,
      preferences: {
        ...state.preferences,
        controls: { ...state.preferences.controls, showBackTextSwipeOverlays: true },
      },
      cards: cards.slice(0, 2),
      sessionsByDeckId: session(0, cards.slice(0, 2)),
      path: `/deck/${deck.id}/study`,
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-SESSION-01 Reveal and rate the first card Good", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Hello" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText("Hola")).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Swipe right" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "Second" })).toBeVisible();
      await expect(canvas.getByRole("slider")).toHaveAttribute("aria-valuetext", "2 of 2");
    });
    await step("STORYBOOK-STUDY-SESSION-02 Complete the last card without a phantom next card", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Second" }));
      await userEvent.click(canvas.getByRole("button", { name: "Swipe right" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Study complete" })).toBeVisible();
      await expect(canvas.getByRole("heading", { name: "Study complete" })).toHaveFocus();
      await expect(canvas.getByText("Session: 2 cards")).toBeVisible();
      await expect(canvas.queryByRole("slider")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("button", { name: "Swipe up: Easy" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Back to deck list" })).toBeEnabled();
    });
  },
};
export const AnswerFailure: Story = {
  parameters: {
    page: {
      ...state,
      preferences: {
        ...state.preferences,
        controls: { ...state.preferences.controls, showBackTextSwipeOverlays: true },
      },
      sessionsByDeckId: session(),
      path: `/deck/${deck.id}/study`,
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-SESSION-03 Report an unsuccessful answer", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(writeStudyAnswer).mockRejectedValueOnce(new Error("Offline"));
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Hello" }));
      await userEvent.click(canvas.getByRole("button", { name: "Swipe right" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("alert")).toHaveTextContent(
        "Unable to save progress. Check your connection and retry."
      );
      await expect(canvas.queryByRole("heading", { name: "Study complete" })).not.toBeInTheDocument();
    });
  },
};

export const DirectionNames: Story = {
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-SESSION-04 Keep action names current without moving focus or answering", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const left = await canvas.findByRole("button", { name: "Swipe left: Again" });
      const directions = ["left", "up", "down", "right"];
      const japaneseDirections = ["左", "上", "下", "右"];
      const ratings = ["Again", "Easy", "Hard", "Good"];
      const buttons = directions.map((direction, index) =>
        canvas.getByRole("button", { name: `Swipe ${direction}: ${ratings[index]}` })
      );
      // When: Exercise `left.focus` with the prepared inputs.
      left.focus();
      await getI18n().changeLanguage("ja");
      for (const [index, button] of buttons.entries()) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // Then: Verify the expected result in the assertions below.
        await expect(button).toHaveAccessibleName(`${japaneseDirections[index]}へスワイプ: ${ratings[index]}`);
        await expect(button).toHaveTextContent(ratings[index]!);
      }
      // When: Exercise `updatePreferences` with the prepared inputs.
      updatePreferences({
        controls: {
          cardSwipeUp: "GoBack",
          cardSwipeDown: "DoNothing",
          cardSwipeLeft: "GoToNextCard",
          cardSwipeRight: "RateHard",
        },
      });
      const actions = ["スキップ", "学習を終了", "何もしない", "Hard"];
      for (const [index, button] of buttons.entries()) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // Then: Verify the expected result in the assertions below.
        await waitFor(() =>
          expect(button).toHaveAccessibleName(`${japaneseDirections[index]}へスワイプ: ${actions[index]}`)
        );
        await expect(button).toHaveTextContent(actions[index]!);
      }
      await expect(left).toHaveFocus();
      await expect(buttons[2]!).toBeDisabled();
      await expect(canvas.getByRole("button", { name: "Hello" })).toBeVisible();
      await expect(canvas.getByRole("slider")).toHaveValue("0");
      await expect(writeStudyAnswer).not.toHaveBeenCalled();
    });
  },
};
