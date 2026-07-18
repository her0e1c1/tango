import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartContent } from "@/features/study/containers/DeckStartContainer";
import { createCard, createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  update: vi.fn(),
  keyHandler: undefined as ((event: KeyboardEvent) => void) | undefined,
}));

vi.mock("react-use", () => ({
  useKey: (_key: string, handler: (event: KeyboardEvent) => void) => {
    mocks.keyHandler = handler;
  },
}));
vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: vi.fn(),
}));
vi.mock("@/features/deck/hooks/useDeckActions", () => ({
  useDeckActions: () => ({ update: mocks.update }),
}));
vi.mock("@/features/study/hooks/useStudyActions", () => ({
  useStudyActions: () => ({ start: mocks.start }),
}));
vi.mock("@/shared/hooks/useActions", () => ({
  useActions: () => ({ setDarkMode: vi.fn(), goToTop: vi.fn(), goByMenu: vi.fn() }),
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
    mocks.keyHandler = undefined;
  });

  it("passes Deck and session context to the template", () => {
    const view = renderContent({ cards: [createCard()], config: createConfig({ maxNumberOfCardsToLearn: 1 }) });
    expect(view.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Start 1 card" })).toBeInTheDocument();
  });

  it("starts from Enter only when cards match and focus is not interactive", () => {
    const view = renderContent({ cards: [createCard()] });
    act(() => mocks.keyHandler?.({ target: document.body } as unknown as KeyboardEvent));
    expect(mocks.start).toHaveBeenCalledOnce();

    mocks.start.mockClear();
    const slider = view.getByRole("slider", { name: "Maximum score value" });
    act(() => mocks.keyHandler?.({ target: slider } as unknown as KeyboardEvent));
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("does not start an empty session from Enter", () => {
    renderContent({ cards: [] });
    act(() => mocks.keyHandler?.({ target: document.body } as unknown as KeyboardEvent));
    expect(mocks.start).not.toHaveBeenCalled();
  });
});
