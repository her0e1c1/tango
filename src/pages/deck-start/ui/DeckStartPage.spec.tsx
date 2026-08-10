/**
 * @file Verifies the "DeckStartContent" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "passes Deck and session
 * context to the view", "starts from Enter when cards match and focus is not interactive",
 * "stops responding to Enter when a rerender has no matching cards".
 */
import type { Card } from "@/entities/card";
import type { ConfigState } from "@/entities/config";

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard } from "@/entities/card";
import { createConfig } from "@/entities/config";
import { createDeck } from "@/entities/deck";

const mocks = vi.hoisted(() => {
  const start = vi.fn();
  return {
    start,
    currentStart: start,
    update: vi.fn(),
  };
});
vi.mock("@/features/remote-collections", () => ({
  useRemoteCollections: vi.fn(),
}));
vi.mock("@/features/card", () => ({ useCardMutations: () => ({}) }));
vi.mock("@/features/deck", async () => {
  const { DeckStartForm } = await vi.importActual<typeof import("@/features/deck/components/DeckStartForm")>(
    "@/features/deck/components/DeckStartForm"
  );
  return {
    DeckStartForm,
    useDeckActions: () => ({ update: mocks.update }),
    useDeckFilterState: () => ({
      scoreMax: 4,
      scoreMin: -2,
      scoreMaxSwitchProps: { name: "maximum-enabled", checked: true, onChange: vi.fn() },
      scoreMinSwitchProps: { name: "minimum-enabled", checked: true, onChange: vi.fn() },
      scoreMaxSliderProps: { name: "maximum", value: "4", min: -10, max: 10, onChange: vi.fn() },
      scoreMinSliderProps: { name: "minimum", value: "-2", min: -10, max: 10, onChange: vi.fn() },
      tagFilterProps: { tags: [], selectedTags: [], tagAndFilter: false },
    }),
  };
});
vi.mock("@/features/study", () => ({
  filterCardsForDeck: (cards: Card[]) => cards,
  useStudyActions: () => ({ start: mocks.currentStart }),
}));
vi.mock("@/features/app-controls", () => ({
  useActions: () => ({
    setDarkMode: vi.fn(),
    goToTop: vi.fn(),
    goToImport: vi.fn(),
    goToSettings: vi.fn(),
  }),
}));

import { DeckStartContent } from "./DeckStartPage";

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
    cleanup();
    vi.clearAllMocks();
    mocks.currentStart = mocks.start;
  });

  it("passes Deck and session context to the template", () => {
    const view = renderContent({ cards: [createCard()], config: createConfig({ maxNumberOfCardsToLearn: 1 }) });
    expect(view.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Start 1 card" })).toBeInTheDocument();
  });

  it("starts from Enter when cards match and focus is not interactive", () => {
    const view = renderContent({ cards: [createCard()] });
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(mocks.start).toHaveBeenCalledOnce();

    mocks.start.mockClear();
    const slider = view.getByRole("slider", { name: "Maximum score value" });
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
