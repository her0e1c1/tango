/**
 * @file Verifies the "CardFormTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "presents the card editor
 * and composes feedback before the form".
 */

import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CardFormTemplate } from "@/features/card/components/templates/CardFormTemplate";
import { createCard } from "@/test/factories";

describe("CardFormTemplate", () => {
  afterEach(cleanup);

  it("presents the card editor and composes feedback before the form", async () => {
    const onCancel = vi.fn();
    const view = render(
      <CardFormTemplate
        feedbackSlot={<div role="status">Saved</div>}
        cardForm={{
          card: createCard({ id: "card-123" }),
          fields: {
            frontText: { name: "frontText" },
            backText: { name: "backText" },
            tags: [],
          },
          onCancel,
        }}
      />
    );

    const heading = view.getByRole("heading", { level: 1, name: "Edit card" });
    const surface = heading.closest("section");
    const feedback = view.getByRole("status");
    const form = view.container.querySelector("form");

    expect(view.getByText("Card editor")).toBeVisible();
    expect(view.getByText("Update the prompt, answer, and organization for this card.")).toBeVisible();
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

    await userEvent.click(view.getByRole("button", { name: "Back to cards" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
