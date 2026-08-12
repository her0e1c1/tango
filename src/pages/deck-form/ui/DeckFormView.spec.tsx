import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/test/factories";

import { DeckFormView } from "./DeckFormView";

describe("DeckFormView", () => {
  it("composes deck context, feedback, and form without the application shell", async () => {
    const onCancel = vi.fn();
    render(
      <DeckFormView
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

    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toHaveClass("line-clamp-3");
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
