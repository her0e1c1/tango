/**
 * @file Verifies the "DeckFormTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "composes deck context,
 * feedback, and form in a bounded semantic editing surface".
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckFormTemplate } from "@/features/deck/components/templates/DeckFormTemplate";
import { createDeck } from "@/test/factories";

describe("DeckFormTemplate", () => {
  it("composes deck context, feedback, and form in a bounded semantic editing surface", async () => {
    const onCancel = vi.fn();
    render(
      <DeckFormTemplate
        feedbackSlot={<div role="status">Saved</div>}
        deckForm={{
          deck: createDeck({ id: "deck-123", name: "Deck name" }),
          fields: {
            name: { name: "name" },
            convertToBr: { name: "convertToBr" },
            url: { name: "url" },
            category: { name: "category", options: [] },
          },
          onCancel,
        }}
      />
    );

    expect(screen.getByText("Deck settings")).toBeVisible();
    const heading = screen.getByRole("heading", { level: 1, name: "Deck name" });
    const feedback = screen.getByRole("status");
    const back = screen.getByRole("button", { name: "Back to decks" });

    expect(heading).toHaveClass("line-clamp-3");
    expect(feedback).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();

    await userEvent.click(back);
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
