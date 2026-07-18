import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckFormTemplate } from "@/features/deck/components/templates/DeckFormTemplate";
import { createDeck } from "@/test/factories";

describe("DeckFormTemplate", () => {
  afterEach(cleanup);

  it("composes deck context, feedback, and form in a bounded semantic editing surface", async () => {
    const onCancel = vi.fn();
    const view = render(
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

    expect(view.getByText("Deck settings")).toBeVisible();
    const heading = view.getByRole("heading", { level: 1, name: "Deck name" });
    const surface = heading.closest("section");
    const feedback = view.getByRole("status");
    const form = view.container.querySelector("form");
    const back = view.getByRole("button", { name: "Back to decks" });

    expect(surface).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-reading",
      "rounded-surface",
      "border",
      "border-border",
      "bg-surface",
      "p-4",
      "md:p-6",
      "overflow-hidden"
    );
    expect(surface).toContainElement(feedback);
    expect(surface).toContainElement(form);
    expect(feedback.compareDocumentPosition(form as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await userEvent.click(back);
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
