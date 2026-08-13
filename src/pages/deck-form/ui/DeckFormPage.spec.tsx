import type { Deck } from "@/entities/deck";
import type { ConfigState } from "@/shared/config";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  config: null as unknown as ConfigState,
  deck: null as Deck | null,
  save: vi.fn(),
  cancel: vi.fn(),
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/config", () => ({
  useConfig: () => mocks.config,
  setDarkMode: mocks.setDarkMode,
}));

vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    useDecks: () => ({
      status: "ready" as const,
      retry: vi.fn(),
      decksById: mocks.deck == null ? {} : { [mocks.deck.id]: mocks.deck },
    }),
  };
});

vi.mock("@/features/deck/edit", () => ({
  useEditDeck: () => ({ update: vi.fn(), pending: false, error: null, retry: vi.fn() }),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/features/deck-editor/hooks/useDeckEditorActions", () => ({
  useDeckEditorActions: (options: { onCancel: () => void; onSaved: () => void }) => ({
    save: async (deck: Deck) => {
      mocks.save(deck);
      options.onSaved();
    },
    cancel: () => {
      mocks.cancel();
      options.onCancel();
    },
    pending: false,
    error: null,
    retry: vi.fn(),
  }),
}));

import { DeckFormPage } from "./DeckFormPage";

describe("DeckFormPage", () => {
  const deck = createDeck({ id: "deck-id", name: "Deck name", url: "", category: "", convertToBr: false });

  beforeEach(() => {
    mocks.params.id = deck.id;
    mocks.deck = deck;
    mocks.config = createConfig({ appearance: { darkMode: false } });
    vi.clearAllMocks();
  });

  it("composes the route, application shell, and deck editor", () => {
    render(<DeckFormPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("owns navigation after saving", async () => {
    render(<DeckFormPage />);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mocks.save).toHaveBeenCalledWith(deck);
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("owns cancellation navigation", async () => {
    render(<DeckFormPage />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.cancel).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("renders missing-deck recovery outside the application shell", () => {
    mocks.deck = null;
    render(<DeckFormPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });

  it("rejects a route without a deck id", () => {
    mocks.params.id = undefined;
    expect(() => render(<DeckFormPage />)).toThrowError("invalid deck id");
  });
});
