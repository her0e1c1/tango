import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckFormTemplate } from "@/features/deck/components/templates/DeckFormTemplate";
import { createDeck } from "@/test/factories";

describe("DeckFormTemplate", () => {
  afterEach(cleanup);

  it("composes feedback before the form in a bounded semantic editing surface", () => {
    const view = render(
      <DeckFormTemplate
        feedbackSlot={<div role="status">Saved</div>}
        deckForm={{
          deck: createDeck({ id: "deck-123" }),
          fields: {
            name: { name: "name" },
            convertToBr: { name: "convertToBr" },
            url: { name: "url" },
            isPublic: { name: "isPublic" },
            localMode: { name: "localMode" },
            category: { name: "category", options: [] },
          },
        }}
      />
    );

    const heading = view.getByRole("heading", { level: 1, name: "Edit deck" });
    const surface = heading.parentElement;
    const feedback = view.getByRole("status");
    const form = view.container.querySelector("form");

    expect(surface).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-reading",
      "rounded-surface",
      "border",
      "border-border",
      "bg-surface",
      "p-4",
      "md:p-6"
    );
    expect(surface).toContainElement(feedback);
    expect(surface).toContainElement(form);
    expect(feedback.compareDocumentPosition(form as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
