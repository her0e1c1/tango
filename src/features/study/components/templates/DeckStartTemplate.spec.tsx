/**
 * @file Verifies the "DeckStartTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "shows Deck context, capped
 * session size, matching count, and filters", "uses singular card wording", "explains and disables
 * an empty session".
 */

import type React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartTemplate } from "@/features/study/components/templates/DeckStartTemplate";

/**
 * Provides the render template test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const renderTemplate = (overrides: Partial<React.ComponentProps<typeof DeckStartTemplate>> = {}) => {
  const onClickStart = vi.fn();
  const view = render(
    <DeckStartTemplate
      deckName="Japanese vocabulary"
      maxNumberOfCardsToLearn={24}
      cardsLength={123}
      onClickStart={onClickStart}
      filterSlot={<div>Filter controls</div>}
      {...overrides}
    />
  );
  return { ...view, onClickStart };
};

describe("DeckStartTemplate", () => {
  it("shows Deck context, capped session size, matching count, and filters", async () => {
    const view = renderTemplate();

    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "24 cards in this session" })).toBeInTheDocument();
    expect(screen.getByText("123 cards match your filters.")).toBeInTheDocument();
    expect(screen.getByText("Filter controls")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start 24 cards" }));
    expect(view.onClickStart).toHaveBeenCalledOnce();
  });

  it("uses singular card wording", () => {
    renderTemplate({ maxNumberOfCardsToLearn: 1, cardsLength: 1 });
    expect(screen.getByRole("heading", { level: 2, name: "1 card in this session" })).toBeInTheDocument();
    expect(screen.getByText("1 card matches your filters.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeInTheDocument();
  });

  it.each([0, -1])("uses all matching cards when the configured maximum is %i", (maxNumberOfCardsToLearn) => {
    renderTemplate({ maxNumberOfCardsToLearn, cardsLength: 123 });
    expect(screen.getByRole("heading", { level: 2, name: "123 cards in this session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start 123 cards" })).toBeInTheDocument();
  });

  it("explains and disables an empty session", () => {
    renderTemplate({ cardsLength: 0 });
    expect(screen.getByRole("heading", { level: 2, name: "0 cards in this session" })).toBeInTheDocument();
    expect(screen.getByText("No cards match your filters.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  });
});
