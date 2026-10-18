import type { StoryObj } from "@storybook/react-vite";
import { expect, fireEvent } from "storybook/test";
import { toggleViewMode } from "@/entities/preference";
import { calculateFsrsState } from "@/entities/card";
import { routeMeta, state, deck, cards, now } from "./support";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  ...routeMeta,
  title: "Integration/Deck view",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/deck/${deck.id}/view` } },
};
export default meta;
type Story = StoryObj<typeof meta>;
const longAnswer = Array.from(
  { length: 120 },
  (_, index) => `Paragraph ${index + 1}: Read this long answer without changing the card.`
).join("\n\n");
const readingCards = [{ ...cards[0]!, backText: longAnswer, tags: ["raw"] }, ...cards.slice(1)];
const reviewed = { ...cards[1]!, fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 } };
function page(controls = {}, values = cards) {
  return {
    ...state,
    cards: values,
    preferences: { ...state.preferences, controls: { ...state.preferences.controls, ...controls } },
    path: `/deck/${deck.id}/view`,
  };
}
function drag(target: Element, dx: number, dy = 0, button = 0) {
  // Dispatch the trailing click in the same task as mouseup, before the browser clears drag suppression.
  target.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      button,
      buttons: button === 0 ? 1 : button === 1 ? 4 : 2,
      clientX: 200,
      clientY: 200,
    })
  );
  document.dispatchEvent(
    new MouseEvent("mousemove", {
      bubbles: true,
      button,
      buttons: button === 0 ? 1 : button === 1 ? 4 : 2,
      clientX: 200 + dx,
      clientY: 200 + dy,
    })
  );
  document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button, clientX: 200 + dx, clientY: 200 + dy }));
  target.dispatchEvent(new MouseEvent(button === 0 ? "click" : "auxclick", { bubbles: true, button }));
}

export const OrderAndAnswer: Story = {
  parameters: {
    page: {
      ...page({}, [cards[0]!, reviewed, { ...state.cards[5]! }]),
      decks: [{ ...deck, cardFilter: { selectedTags: [], tagAndFilter: false } }],
      preferences: { ...state.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-VIEW-01 Browse the deck independently of review due dates", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Hola");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByText("Hola"));
      await userEvent.click(canvas.getByRole("button", { name: "Next card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
      await expect(canvas.getByRole("slider")).toHaveAttribute("aria-valuetext", "2 of 2");
      await expect(canvas.queryByText("Other prompt")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Second answer");
    });
  },
};
export const Empty: Story = {
  parameters: { page: { ...page(), cards: [] } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-VIEW-02 Explain a deck without any cards", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByRole("heading", { name: "No cards yet" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Card front" })).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Back to deck list" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
    });
  },
};
export const NoMatches: Story = {
  parameters: {
    page: { ...page(), decks: [{ ...deck, cardFilter: { selectedTags: ["missing"], tagAndFilter: false } }] },
  },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-VIEW-03 Distinguish unmatched filters from no cards", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "No cards match the current filters." })).toBeVisible();
      await expect(canvas.queryByText("No cards yet")).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Back to deck list" })).toBeEnabled();
    });
  },
};
export const Reading: Story = {
  parameters: { page: page({}, readingCards) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByRole("button", { name: "Card front" }));
    toggleViewMode();
    const answer = await canvas.findByRole("region", { name: "Card answer" });
    await step("STORYBOOK-CARD-PLAYER-01 Scroll and drag a long answer without moving cards", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(answer.scrollHeight).toBeGreaterThan(answer.clientHeight);
      answer.scrollTop = 100;
      // When: Exercise `fireEvent.scroll` with the prepared inputs.
      await fireEvent.scroll(answer);
      // Then: Verify the expected result in the assertions below.
      await expect(answer.scrollTop).toBe(100);
      // When: Exercise `drag` with the prepared inputs.
      await drag(answer, 0, 80);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Paragraph 1:");
      await expect(canvas.queryByText("Second answer")).not.toBeInTheDocument();
    });
    await step("STORYBOOK-CARD-PLAYER-02 Preserve a text selection while reading", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const text = answer.querySelector("pre")!.firstChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 12);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);
      // When: Exercise `drag` with the prepared inputs.
      drag(answer, 0, 40);
      // Then: Verify the expected result in the assertions below.
      await expect(window.getSelection()!.toString()).toBe("Paragraph 1:");
      await expect(answer).toBeVisible();
      await expect(canvas.queryByRole("heading", { name: "Decks" })).not.toBeInTheDocument();
      window.getSelection()!.removeAllRanges();
    });
    await step("STORYBOOK-CARD-PLAYER-09 Scroll the answer with an edge wheel event", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const before = answer.scrollTop;
      // When: Exercise `fireEvent.wheel` with the prepared inputs.
      await fireEvent.wheel(canvas.getByRole("button", { name: "Swipe right" }), { deltaY: 100 });
      // Then: Verify the expected result in the assertions below.
      await expect(answer.scrollTop).toBeGreaterThan(before);
      await expect(answer).toHaveTextContent("Paragraph 1:");
      await expect(canvas.queryByText("Second answer")).not.toBeInTheDocument();
    });
  },
};
export const FlipAndPlayback: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-03 Distinguish Space playback from card taps", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard(" ");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true");
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Hola");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByText("Hola"));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
    });
    await step("STORYBOOK-CARD-PLAYER-14 Toggle only swipe controls with their keyboard shortcut", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("b");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Pause" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
      await expect(canvas.getByRole("slider")).toHaveValue("0");
    });
  },
};
export const AnswerChromeAndEdges: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByRole("button", { name: "Next card" }));
    await step(
      "STORYBOOK-CARD-PLAYER-06 STORYBOOK-CARD-PLAYER-07 Hide front-only editing and details on the answer",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        await expect(canvas.getByRole("link", { name: "Edit card" })).toBeVisible();
        await expect(canvas.getByText("not studied yet")).toBeVisible();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Second answer");
        await expect(canvas.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
        await expect(canvas.queryByText("not studied yet")).not.toBeInTheDocument();
      }
    );
    await step("STORYBOOK-CARD-PLAYER-08 Separate edge navigation from answer clicks", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Swipe right" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Third");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
      await userEvent.click(canvas.getByRole("button", { name: "Swipe left" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
      await userEvent.click(canvas.getByText("Second answer"));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
      await expect(canvas.getByRole("slider")).toHaveValue("1");
    });
    await step("STORYBOOK-CARD-PLAYER-04 Keep allowed answer movement after changing viewing settings", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      await userEvent.click(canvas.getByRole("button", { name: "Swipe controls" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close card actions" }));
      await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
      await userEvent.click(canvas.getByRole("button", { name: "Swipe right" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Third");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
      await userEvent.click(canvas.getByRole("button", { name: "Swipe left" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
    });
  },
};
export const Toolbar: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByRole("button", { name: "Open card actions" }));
    await step("STORYBOOK-CARD-PLAYER-05 Toggle the edit shortcut without changing content", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit link" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close card actions" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      await userEvent.click(canvas.getByRole("button", { name: "Edit link" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close card actions" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("link", { name: "Edit card" })).toBeVisible();
    });
    await step(
      "STORYBOOK-CARD-PLAYER-10 STORYBOOK-CARD-PLAYER-15 Toggle each selected toolbar setting independently",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
        await userEvent.click(canvas.getByRole("button", { name: "Card details" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByText("not studied yet")).not.toBeInTheDocument();
        await expect(canvas.getByRole("button", { name: "Playback controls" })).toHaveAttribute("aria-pressed", "true");
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Swipe controls" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
        await expect(canvas.getByRole("button", { name: "Play" })).toBeVisible();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Playback controls" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
        await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Card details" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByText("not studied yet")).toBeVisible();
      }
    );
    await step("STORYBOOK-CARD-PLAYER-11 Restore the help shortcut through the action list", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Help button" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close card actions" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "Open viewing help" })).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      await userEvent.click(canvas.getByRole("button", { name: "Help button" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close card actions" }));
      await userEvent.click(canvas.getByRole("button", { name: "Open viewing help" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("dialog", { name: "Viewing controls" })).toBeVisible();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
    });
  },
};
export const ViewingMode: Story = {
  parameters: { page: page({}, [{ ...cards[0]!, frontText: longAnswer, tags: ["raw"] }, ...cards.slice(1)]) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-12 Show the active reading mode through its pressed state", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const toggle = await canvas.findByRole("button", { name: "View mode" });
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      const reading = canvas.getByRole("region", { name: "Card front text" });
      await expect(reading).toHaveFocus();
      await expect(reading.scrollHeight).toBeGreaterThan(reading.clientHeight);
    });
    await step("STORYBOOK-CARD-PLAYER-13 Hide the mode shortcut while preserving reading and scrolling", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      await userEvent.click(canvas.getByRole("button", { name: "View mode" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close card actions" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "View mode" })).not.toBeInTheDocument();
      const reading = canvas.getByRole("region", { name: "Card front text" });
      reading.scrollTop = 100;
      // When: Exercise `fireEvent.scroll` with the prepared inputs.
      await fireEvent.scroll(reading);
      // Then: Verify the expected result in the assertions below.
      await expect(reading.scrollTop).toBe(100);
      await expect(reading).toHaveTextContent("Paragraph 1:");
    });
  },
};
export const PlaybackUnavailable: Story = {
  parameters: {
    page: { ...page(), preferences: { ...state.preferences, study: { ...state.preferences.study, cardInterval: 0 } } },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-16 Explain disabled playback without starting it", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Open card actions" }));
      const toggle = canvas.getByRole("button", { name: "Playback controls" });
      // Then: Verify the expected result in the assertions below.
      await expect(toggle).toHaveAttribute("aria-disabled", "true");
      await expect(toggle).toHaveAccessibleDescription(
        "Playback controls unavailable because the card interval is set to 0"
      );
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "Pause" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Hello");
    });
  },
};
function bottomControls(swipe: boolean, playback: boolean): Story {
  return {
    parameters: { page: page({ showSwipeButtonList: swipe, showPlaybackControls: playback }) },
    play: async ({ canvas, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step("STORYBOOK-CARD-PLAYER-17 Display only the enabled bottom control groups", async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        await canvas.findByText("Hello");
        // When: Storybook renders this scenario with its configured args and parameters.
        // Then: Verify the expected result in the assertions below.
        if (swipe) await expect(canvas.getByRole("button", { name: "Next card" })).toBeVisible();
        else await expect(canvas.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
        if (playback) await expect(canvas.getByRole("button", { name: "Play" })).toBeVisible();
        else await expect(canvas.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
      });
    },
  };
}
export const SwipeOnly = bottomControls(true, false);
export const PlaybackOnly = bottomControls(false, true);
export const NoBottomControls = bottomControls(false, false);
export const Gestures: Story = {
  parameters: { page: page({ showSwipeButtonList: false }) },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step(
      "STORYBOOK-CARD-PLAYER-19 STORYBOOK-CARD-PLAYER-20 Move exactly once with a primary drag while buttons are hidden",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        const front = await canvas.findByRole("button", { name: "Card front" });
        // When: Storybook renders this scenario with its configured args and parameters.
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
        // When: Exercise `drag` with the prepared inputs.
        await drag(front, 100);
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
        await expect(canvas.getByRole("slider")).toHaveValue("1");
        await expect(canvas.queryByRole("region", { name: "Card answer" })).not.toBeInTheDocument();
      }
    );
    await step("STORYBOOK-CARD-PLAYER-21 Ignore middle and secondary button drags", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      for (const button of [1, 2]) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `drag` with the prepared inputs.
        await drag(canvas.getByRole("button", { name: "Card front" }), 100, 0, button);
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
        await expect(canvas.getByRole("slider")).toHaveValue("1");
      }
    });
  },
};
export const AnswerGestures: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByRole("button", { name: "Card front" }));
    await step("STORYBOOK-CARD-PLAYER-18 Ignore vertical rating gestures on browsing answers", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      for (const dy of [-100, 100]) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `drag` with the prepared inputs.
        await drag(canvas.getByRole("region", { name: "Card answer" }), 0, dy);
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("region", { name: "Card answer" })).toHaveTextContent("Hola");
        await expect(canvas.queryByText(/FSRS D:/)).not.toBeInTheDocument();
      }
    });
    await step("STORYBOOK-CARD-PLAYER-22 Suppress the trailing click after an allowed answer drag", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `drag` with the prepared inputs.
      await drag(canvas.getByRole("region", { name: "Card answer" }), 100);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
      await expect(canvas.getByRole("slider")).toHaveValue("1");
      await expect(canvas.queryByRole("region", { name: "Card answer" })).not.toBeInTheDocument();
    });
  },
};
export const Difficulty: Story = {
  parameters: { page: page({}, [cards[0]!, reviewed]) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-23 Distinguish unstudied cards from numeric FSRS difficulty", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByText("not studied yet")).toBeVisible();
      await expect(canvas.queryByText(/FSRS D:/)).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Next card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText(/FSRS D: \d/)).toBeVisible();
      await expect(canvas.queryByText("not studied yet")).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Card front" })).toHaveTextContent("Second");
    });
  },
};
