/**
 * @file Verifies the "DeckStartContent" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "passes Deck and session
 * context to the template", "starts from Enter when cards match and focus is not interactive",
 * "stops responding to Enter when a rerender has no matching cards".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartContent } from "@/features/study/containers/DeckStartContainer";
import { createCard, createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => {
  const start = vi.fn();
  return {
    start,
    currentStart: start,
    update: vi.fn(),
    navigate: vi.fn(),
    setDarkMode: vi.fn(),
  };
});
vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: vi.fn(),
}));
vi.mock("@/features/deck/hooks/useDeckActions", () => ({
  useDeckActions: () => ({ update: mocks.update }),
}));
vi.mock("@/features/study/hooks/useStudyActions", () => ({
  useStudyActions: () => ({ start: mocks.currentStart }),
}));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ id: "deck-id" }),
}));
vi.mock("@/shared/config", () => ({
  useConfig: () => ({}),
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/features/deck/hooks/useDeckFilterState", () => ({
  useDeckFilterState: () => ({
    scoreMax: 4,
    scoreMin: -2,
    scoreMaxSwitchProps: { name: "maximum-enabled", checked: true, onChange: vi.fn() },
    scoreMinSwitchProps: { name: "minimum-enabled", checked: true, onChange: vi.fn() },
    scoreMaxSliderProps: { name: "maximum", value: "4", min: -10, max: 10, onChange: vi.fn() },
    scoreMinSliderProps: { name: "minimum", value: "-2", min: -10, max: 10, onChange: vi.fn() },
    tagFilterProps: { tags: [], selectedTags: [], tagAndFilter: false },
  }),
}));

/**
 * Provides the render content test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const renderContent = ({
  cards = [createCard()],
  config = createConfig(),
}: {
  cards?: Card[];
  config?: ConfigState;
} = {}) =>
  render(
    <DeckStartContent deck={createDeck({ name: "Japanese vocabulary" })} cards={cards} config={config} tags={[]} />
  );

describe("DeckStartContent", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mocks.currentStart = mocks.start;
  });

  it("passes Deck and session context to the template", () => {
    renderContent({ cards: [createCard()], config: createConfig({ maxNumberOfCardsToLearn: 1 }) });
    expect(screen.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start 1 card" })).toBeInTheDocument();
  });

  it("forwards header actions", () => {
    renderContent();

    fireEvent.click(screen.getByRole("button", { name: "tango" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Import decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(mocks.setDarkMode).toHaveBeenCalledExactlyOnceWith(true);
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/import");
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, "/settings");
  });

  it("starts from Enter when cards match and focus is not interactive", () => {
    renderContent({ cards: [createCard()] });
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).toHaveBeenCalledOnce();

    mocks.start.mockClear();
    const slider = screen.getByRole("slider", { name: "Maximum score value" });
    fireEvent.keyDown(slider, { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("stops responding to Enter when a rerender has no matching cards", () => {
    const view = renderContent({ cards: [createCard()] });
    view.rerender(
      <DeckStartContent
        deck={createDeck({ name: "Japanese vocabulary" })}
        cards={[]}
        config={createConfig()}
        tags={[]}
      />
    );

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("uses the current start action when a rerender gains matching cards", () => {
    const currentStart = vi.fn();
    const view = renderContent({ cards: [] });
    mocks.currentStart = currentStart;
    view.rerender(
      <DeckStartContent
        deck={createDeck({ name: "Japanese vocabulary" })}
        cards={[createCard()]}
        config={createConfig()}
        tags={[]}
      />
    );

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
    expect(currentStart).toHaveBeenCalledOnce();
  });

  it("uses the current start action when a rerender keeps the same card count", () => {
    const currentStart = vi.fn();
    const view = renderContent({ cards: [createCard()] });
    mocks.currentStart = currentStart;
    view.rerender(
      <DeckStartContent
        deck={createDeck({ name: "Japanese vocabulary" })}
        cards={[createCard()]}
        config={createConfig()}
        tags={[]}
      />
    );

    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).not.toHaveBeenCalled();
    expect(currentStart).toHaveBeenCalledOnce();
  });
});
