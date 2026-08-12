import type { Deck } from "@/entities/deck";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/test/factories";

import { DeckForm } from "../components/DeckForm";
import { useDeckFormState } from "./useDeckFormState";

const DeckFormHarness = (props: { deck: Deck; onCancel?: () => void; onSubmit?: (deck: Deck) => void }) => {
  const deckForm = useDeckFormState({
    ...props,
    categoryOptions: [{ label: "Math", value: "math" }],
  });
  return <DeckForm {...deckForm} />;
};

describe("useDeckFormState", () => {
  const deck = createDeck({ id: "deck-id", name: "Deck name", url: "", category: "", convertToBr: false });

  it("maps edited form values back to the deck", async () => {
    const onSubmit = vi.fn();
    render(<DeckFormHarness deck={deck} onSubmit={onSubmit} />);

    const name = screen.getByRole("textbox", { name: "Name" });
    const url = screen.getByRole("textbox", { name: "Source URL" });
    await userEvent.clear(name);
    await userEvent.type(name, " Updated ");
    await userEvent.type(url, "https://example.com/deck.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "math");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith({
      ...deck,
      name: "Updated",
      url: "https://example.com/deck.csv",
      convertToBr: true,
      category: "math",
    });
  });

  it("exposes schema validation errors without submitting", async () => {
    const onSubmit = vi.fn();
    render(<DeckFormHarness deck={deck} onSubmit={onSubmit} />);

    const name = screen.getByRole("textbox", { name: "Name" });
    const url = screen.getByRole("textbox", { name: "Source URL" });
    await userEvent.clear(name);
    await userEvent.type(name, "   ");
    await userEvent.type(url, "not-a-url");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Deck name is required.")).toBeVisible();
    expect(screen.getByText("Enter a valid URL.")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("forwards cancellation", async () => {
    const onCancel = vi.fn();
    render(<DeckFormHarness deck={deck} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
