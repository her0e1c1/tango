import type React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { StudySessionStart } from "./StudySessionStart";

const renderView = (overrides: Partial<React.ComponentProps<typeof StudySessionStart>> = {}) => {
  const onClickStart = vi.fn();
  const view = render(
    <StudySessionStart
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

describe("StudySessionStart", () => {
  it("shows deck context, capped session size, matching count, and filters", async () => {
    const view = renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "24 cards in this session" })).toBeVisible();
    expect(screen.getByText("123 cards match your filters.")).toBeVisible();
    expect(screen.getByText("Filter controls")).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start 24 cards" }));
    expect(view.onClickStart).toHaveBeenCalledOnce();
  });

  it("uses singular wording", () => {
    renderView({ maxNumberOfCardsToLearn: 1, cardsLength: 1 });
    expect(screen.getByText("1 card matches your filters.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeVisible();
  });

  it.each([0, -1])("uses all matching cards when the maximum is %i", (maxNumberOfCardsToLearn) => {
    renderView({ maxNumberOfCardsToLearn, cardsLength: 123 });
    expect(screen.getByRole("button", { name: "Start 123 cards" })).toBeVisible();
  });

  it("explains and disables an empty session", () => {
    renderView({ cardsLength: 0 });
    expect(screen.getByText("No cards match your filters.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  });
});
