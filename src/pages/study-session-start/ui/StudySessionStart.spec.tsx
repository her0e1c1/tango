import type React from "react";
import { act, render, screen } from "@testing-library/react";
import { getI18n } from "react-i18next";
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

describe("SETTINGS-04 STUDY-SESSION-01 STUDY-SESSION-02 StudySessionStart", () => {
  it("shows deck context, capped session size, matching count, and filters", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "24 cards in this session" })).toBeVisible();
    expect(screen.getByText("123 cards match your filters.")).toBeVisible();
    expect(screen.getByText("Filter controls")).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Start 24 cards" }));
    // Then: Verify the expected result in the assertions below.
    expect(view.onClickStart).toHaveBeenCalledOnce();
  });

  it("uses singular wording", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderView` with the prepared inputs.
    renderView({ maxNumberOfCardsToLearn: 1, cardsLength: 1 });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("1 card matches your filters.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeVisible();
  });

  it.each([0, -1])("uses all matching cards when the maximum is %i", (maxNumberOfCardsToLearn) => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderView` with the prepared inputs.
    renderView({ maxNumberOfCardsToLearn, cardsLength: 123 });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Start 123 cards" })).toBeVisible();
  });

  it("explains and disables an empty session", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderView` with the prepared inputs.
    renderView({ cardsLength: 0 });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("No cards match your filters.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  });

  it("places filter controls before the start action in keyboard order", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    renderView({ filterSlot: <button type="button">Filter control</button> });

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Filter control" })).toHaveFocus();

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Start 24 cards" })).toHaveFocus();
  });

  it("localizes session counts without translating the Deck name", () => {
    // Given: Use this case's inputs and any shared test setup.
    renderView({ maxNumberOfCardsToLearn: 1, cardsLength: 1 });

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      void getI18n().changeLanguage("ja");
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "1枚をこのセッションで学習" })).toBeVisible();
    expect(screen.getByText("フィルターに一致するカードは1枚です。")).toBeVisible();
    expect(screen.getByRole("button", { name: "1枚で開始" })).toBeVisible();
  });
});
