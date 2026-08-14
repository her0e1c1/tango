import type { Deck } from "@/entities/deck";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  editDeck: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  useAuthSession: () => ({ status: "authenticated" as const, uid: "user-id", isAnonymous: false, displayName: null }),
}));
vi.mock("@/entities/deck", () => ({
  CATEGORY: ["language", "science"],
  editDeck: mocks.editDeck,
}));

import { DeckEditForm } from "./DeckEditForm";

describe("DeckEditForm", () => {
  const deck: Deck = createDeck({
    id: "deck-id",
    name: "Deck name",
    url: "",
    category: "language",
    convertToBr: false,
  });

  beforeEach(() => {
    mocks.editDeck.mockReset().mockResolvedValue(undefined);
  });

  it("saves edited form values for the authenticated user and reports success", async () => {
    const onSaved = vi.fn();
    render(<DeckEditForm deck={deck} onCancel={vi.fn()} onSaved={onSaved} />);

    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, " Updated deck ");
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "https://example.com/deck.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "science");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mocks.editDeck).toHaveBeenCalledWith("user-id", {
        ...deck,
        name: "Updated deck",
        url: "https://example.com/deck.csv",
        convertToBr: true,
        category: "science",
      })
    );
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("uses the form submit state while saving", async () => {
    let finishSave: (() => void) | undefined;
    mocks.editDeck.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
    );
    render(<DeckEditForm deck={deck} onCancel={vi.fn()} onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    finishSave?.();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  });

  it("keeps edited values and allows another save after a failure", async () => {
    mocks.editDeck.mockRejectedValueOnce(new Error("write failed"));
    const onSaved = vi.fn();
    render(<DeckEditForm deck={deck} onCancel={vi.fn()} onSaved={onSaved} />);
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Retry deck");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(name).toHaveValue("Retry deck");
    expect(onSaved).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mocks.editDeck).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument());
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("forwards cancellation from both navigation actions", async () => {
    const onCancel = vi.fn();
    render(<DeckEditForm deck={deck} onCancel={onCancel} onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("validates fields before saving", async () => {
    render(<DeckEditForm deck={deck} onCancel={vi.fn()} onSaved={vi.fn()} />);
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "not-a-url");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Deck name is required.")).toBeVisible();
    expect(screen.getByText("Enter a valid URL.")).toBeVisible();
    expect(mocks.editDeck).not.toHaveBeenCalled();
  });
});
