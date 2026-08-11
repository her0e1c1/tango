import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "card-id" as string | undefined },
  config: { darkMode: false } as ConfigState,
  card: null as Card | null,
  deck: null as Deck | null,
  navigate: vi.fn(),
  goToTop: vi.fn(),
  goToImport: vi.fn(),
  goToSettings: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/hooks/useConfig", () => ({ useConfig: () => mocks.config }));
vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    setDarkMode: mocks.setDarkMode,
    goToTop: mocks.goToTop,
    goToImport: mocks.goToImport,
    goToSettings: mocks.goToSettings,
  }),
}));
vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    status: "ready" as const,
    retry: vi.fn(),
    cardById: (id: string) => (mocks.card?.id === id ? mocks.card : undefined),
    deckById: (id: string) => (mocks.deck?.id === id ? mocks.deck : undefined),
  }),
}));
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

import { CardViewPage } from "./CardViewPage";

describe("CardViewPage", () => {
  beforeEach(() => {
    mocks.params.id = "card-id";
    mocks.config = { darkMode: false } as ConfigState;
    mocks.deck = createDeck({ id: "deck-id", category: "raw" });
    mocks.card = createCard({ id: "card-id", deckId: "deck-id", backText: "const answer = 42;", tags: ["typescript"] });
    mocks.navigate.mockReset();
    mocks.goToTop.mockReset();
    mocks.goToImport.mockReset();
    mocks.goToSettings.mockReset();
    mocks.setDarkMode.mockReset();
  });

  afterEach(cleanup);

  it("renders the card answer using its resolved category", () => {
    const view = render(<CardViewPage />);

    expect(view.container.querySelector("pre.typescript")).toHaveTextContent("const answer = 42;");
  });

  it("renders the ready screen in the application shell and forwards header actions", async () => {
    const view = render(<CardViewPage />);
    const logo = view.getByRole("button", { name: "tango" });
    const headerActions = logo.parentElement?.querySelectorAll("svg");

    expect(headerActions).toHaveLength(3);
    await userEvent.click(logo);
    await userEvent.click(headerActions?.[0] as SVGElement);
    await userEvent.click(headerActions?.[1] as SVGElement);
    await userEvent.click(headerActions?.[2] as SVGElement);

    expect(mocks.goToTop).toHaveBeenCalledOnce();
    expect(mocks.setDarkMode).toHaveBeenCalledExactlyOnceWith(true);
    expect(mocks.goToImport).toHaveBeenCalledOnce();
    expect(mocks.goToSettings).toHaveBeenCalledOnce();
  });

  it("shows recovery actions when the card is unavailable", async () => {
    mocks.card = null;
    const view = render(<CardViewPage />);

    expect(view.getByRole("heading", { level: 1, name: "Card not found" })).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(view.getByRole("button", { name: "Go home" }));
    await userEvent.click(view.getByRole("button", { name: "Go back" }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, -1);
  });

  it("preserves the invalid route error", () => {
    mocks.params.id = undefined;
    expect(() => render(<CardViewPage />)).toThrowError("invalid card id");
  });
});
