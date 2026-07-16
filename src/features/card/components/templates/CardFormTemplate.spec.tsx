import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CardFormTemplate } from "@/features/card/components/templates/CardFormTemplate";
import { createCard } from "@/test/factories";

describe("CardFormTemplate", () => {
  afterEach(cleanup);

  it("composes feedback before the form in a bounded semantic editing surface", () => {
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
        }}
      />
    );

    const heading = view.getByRole("heading", { level: 1, name: "Edit card" });
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
