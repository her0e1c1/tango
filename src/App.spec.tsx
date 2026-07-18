import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  darkMode: false,
  init: vi.fn(),
}));

vi.mock("zustand", () => ({
  useStore: (_store: unknown, select: (state: unknown) => unknown) =>
    select({
      config: { darkMode: mocks.darkMode },
    }),
}));
vi.mock("@/store/configStore", () => ({ configStore: {} }));
vi.mock("@/action", () => ({ event: { init: mocks.init } }));
vi.mock("@/page", () => ({
  DeckListPage: () => <div>Deck list</div>,
  CardListPage: () => null,
  DeckFormPage: () => null,
  DeckStartPage: () => null,
  DeckSwiperPage: () => null,
  CardViewPage: () => null,
  CardFormPage: () => null,
  ConfigPage: () => null,
  DeckImportPage: () => null,
}));

import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    mocks.darkMode = false;
    mocks.init.mockReset();
    document.documentElement.classList.remove("dark");
  });

  it("updates only the theme when the setting changes", () => {
    const view = render(<App />);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    mocks.darkMode = true;
    view.rerender(<App />);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(mocks.init).not.toHaveBeenCalled();
  });
});
