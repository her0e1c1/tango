/**
 * @file Verifies the "CardFormView" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "presents the card editor
 * and composes feedback before the form".
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { CardFormView } from "./CardFormView";

describe("CardFormView", () => {
  it("presents the card editor and composes feedback before the form", async () => {
    const onCancel = vi.fn();
    render(
      <CardFormView
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

    const heading = screen.getByRole("heading", { level: 1, name: "Edit card" });
    const feedback = screen.getByRole("status");

    expect(screen.getByText("Card editor")).toBeVisible();
    expect(screen.getByText("Update the prompt, answer, and organization for this card.")).toBeVisible();
    expect(heading).toBeVisible();
    expect(feedback).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Back to cards" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
