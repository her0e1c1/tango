import type React from "react";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartTemplate } from "@/features/study/components/templates/DeckStartTemplate";

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
  afterEach(cleanup);

  it("shows Deck context, capped session size, matching count, and filters", async () => {
    const view = renderTemplate();

    expect(view.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "24 cards in this session" })).toBeInTheDocument();
    expect(view.getByText("123 cards match your filters.")).toBeInTheDocument();
    expect(view.getByText("Filter controls")).toBeInTheDocument();

    await userEvent.click(view.getByRole("button", { name: "Start 24 cards" }));
    expect(view.onClickStart).toHaveBeenCalledOnce();
  });

  it("uses singular card wording", () => {
    const view = renderTemplate({ maxNumberOfCardsToLearn: 1, cardsLength: 1 });
    expect(view.getByRole("heading", { level: 2, name: "1 card in this session" })).toBeInTheDocument();
    expect(view.getByText("1 card matches your filters.")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Start 1 card" })).toBeInTheDocument();
  });

  it("explains and disables an empty session", () => {
    const view = renderTemplate({ cardsLength: 0 });
    expect(view.getByRole("heading", { level: 2, name: "0 cards in this session" })).toBeInTheDocument();
    expect(view.getByText("No cards match your filters.")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  });
});
