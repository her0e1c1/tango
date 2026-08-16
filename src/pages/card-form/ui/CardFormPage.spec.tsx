import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preferences";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "card-id" as string | undefined },
  preferences: null as unknown as Preferences,
  card: null as Card | null,
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/entities/card", () => ({
  useCard: () => mocks.card ?? undefined,
}));
vi.mock("@/features/card-edit", () => ({
  CardEditForm: (props: { card: Card; onCancel: () => void; onSaved: () => void }) => (
    <section>
      <h1>{props.card.frontText}</h1>
      <button type="button" onClick={props.onSaved}>
        Save changes
      </button>
      <button type="button" onClick={props.onCancel}>
        Cancel
      </button>
    </section>
  ),
}));
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { CardFormPage } from "./CardFormPage";

describe("CardFormPage", () => {
  const card = createCard({ id: "card-id", frontText: "Front text" });

  beforeEach(() => {
    mocks.params.id = card.id;
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.card = card;
    mocks.navigate.mockReset();
    mocks.setDarkMode.mockReset();
  });

  it("composes the resolved card editor in the application shell", () => {
    render(<CardFormPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Front text" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("owns navigation after saving", async () => {
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("owns cancellation navigation", async () => {
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("shows recovery actions when the card is unavailable", async () => {
    mocks.card = null;
    render(<CardFormPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/", undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, -1);
  });

  it("rejects a route without a card id", () => {
    mocks.params.id = undefined;

    expect(() => render(<CardFormPage />)).toThrowError("invalid card id");
  });
});
