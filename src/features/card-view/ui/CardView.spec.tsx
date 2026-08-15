import type { Preferences } from "@/entities/preferences";

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
}));

import { CardView } from "./CardView";

const CODE_ANSWER_PATTERN = /answer =/;

describe("CardView", () => {
  beforeEach(() => {
    mocks.preferences = createPreferences({ appearance: { darkMode: true } });
  });

  it("renders the answer using the card category and appearance", () => {
    const card = createCard({ backText: "const answer = 42;", tags: ["typescript"] });
    const deck = createDeck({ category: "raw" });

    render(<CardView card={card} deck={deck} />);

    const code = screen.getByText(CODE_ANSWER_PATTERN);
    expect(code).toHaveTextContent("const answer = 42;");
    expect(code).toHaveAttribute("data-language", "typescript");
    expect(code).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("region", { name: "Card answer" })).toHaveClass("max-w-reading", "bg-surface-elevated");
  });

  it("supports the bare study layout and click behavior", () => {
    const onClick = vi.fn();

    render(
      <CardView card={createCard({ backText: "Card answer" })} deck={createDeck()} onClick={onClick} variant="bare" />
    );

    const answer = screen.getByText("Card answer");
    expect(screen.queryByRole("region", { name: "Card answer" })).not.toBeInTheDocument();
    fireEvent.click(answer);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
